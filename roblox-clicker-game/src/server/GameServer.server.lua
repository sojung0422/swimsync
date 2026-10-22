-- GameServer (Script) -> ServerScriptService.GameServer
-- Handles player data, clicking, upgrades, rebirths and all Robux purchases.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService = game:GetService("DataStoreService")
local MarketplaceService = game:GetService("MarketplaceService")
local RunService = game:GetService("RunService")

local Config = require(ReplicatedStorage:WaitForChild("Config"))

local DATA_VERSION = "v1"
local AUTOSAVE_INTERVAL = 60
local RECEIPT_RETENTION_SECONDS = 60 * 60 * 24 * 30

local playerStore = DataStoreService:GetDataStore("PlayerData_" .. DATA_VERSION)

-- ===== Remotes =====
local remotes = Instance.new("Folder")
remotes.Name = "Remotes"

local clickEvent = Instance.new("RemoteEvent")
clickEvent.Name = "Click"
clickEvent.Parent = remotes

local dataUpdatedEvent = Instance.new("RemoteEvent")
dataUpdatedEvent.Name = "DataUpdated"
dataUpdatedEvent.Parent = remotes

local notifyEvent = Instance.new("RemoteEvent")
notifyEvent.Name = "Notify"
notifyEvent.Parent = remotes

local buyUpgradeFunc = Instance.new("RemoteFunction")
buyUpgradeFunc.Name = "BuyUpgrade"
buyUpgradeFunc.Parent = remotes

local rebirthFunc = Instance.new("RemoteFunction")
rebirthFunc.Name = "Rebirth"
rebirthFunc.Parent = remotes

remotes.Parent = ReplicatedStorage

-- ===== Session state =====
local sessionData = {} -- [Player] = saved data table
local ownedPasses = {} -- [Player] = { [passKey] = true }
local clickWindows = {} -- [Player] = { start = number, count = number }

local function defaultData()
	return {
		Coins = 0,
		ClickPower = 0,
		Rebirths = 0,
		TotalClicks = 0,
		Receipts = {}, -- [PurchaseId] = os.time() when granted
	}
end

local passKeyById = {}
for key, pass in Config.GamePasses do
	if pass.Id ~= 0 then
		passKeyById[pass.Id] = key
	end
end

local productById = {}
for _, product in Config.Products do
	if product.Id ~= 0 then
		productById[product.Id] = product
	end
end

-- ===== Calculations =====
local function getMultiplier(player: Player): number
	local data = sessionData[player]
	local passes = ownedPasses[player] or {}
	local mult = Config.GetRebirthMultiplier(data.Rebirths)
	if passes.DoubleCoins then
		mult *= 2
	end
	if passes.VIP then
		mult *= 1.5
	end
	return mult
end

local function getClickValue(player: Player): number
	local data = sessionData[player]
	local base = Config.BaseClickValue + data.ClickPower * Config.ClickPowerPerLevel
	return base * getMultiplier(player)
end

-- ===== Syncing =====
local function syncPlayer(player: Player)
	local data = sessionData[player]
	if not data then
		return
	end

	local leaderstats = player:FindFirstChild("leaderstats")
	if leaderstats then
		leaderstats.Coins.Value = math.floor(data.Coins)
		leaderstats.Rebirths.Value = data.Rebirths
	end

	dataUpdatedEvent:FireClient(player, {
		Coins = data.Coins,
		ClickPower = data.ClickPower,
		Rebirths = data.Rebirths,
		ClickValue = getClickValue(player),
		Multiplier = getMultiplier(player),
		UpgradeCost = Config.GetUpgradeCost(data.ClickPower),
		RebirthCost = Config.GetRebirthCost(data.Rebirths),
		Passes = ownedPasses[player] or {},
	})
end

local function notify(player: Player, message: string)
	notifyEvent:FireClient(player, message)
end

-- ===== Saving / loading =====
local function saveData(player: Player): boolean
	local data = sessionData[player]
	if not data then
		return false
	end

	local ok, err = pcall(function()
		playerStore:SetAsync(tostring(player.UserId), data, { player.UserId })
	end)
	if not ok then
		warn("[GameServer] Failed to save data for", player.Name, err)
	end
	return ok
end

local function loadData(player: Player)
	local key = tostring(player.UserId)
	for attempt = 1, 3 do
		local ok, result = pcall(function()
			return playerStore:GetAsync(key)
		end)
		if ok then
			return true, result
		end
		warn("[GameServer] Load attempt", attempt, "failed for", player.Name, result)
		task.wait(2)
	end
	return false, nil
end

local function reconcile(saved)
	local data = defaultData()
	if type(saved) == "table" then
		for k, v in saved do
			data[k] = v
		end
	end

	-- Drop old receipt records so the table never grows without limit.
	local now = os.time()
	for purchaseId, grantedAt in data.Receipts do
		if now - grantedAt > RECEIPT_RETENTION_SECONDS then
			data.Receipts[purchaseId] = nil
		end
	end
	return data
end

-- ===== VIP tag =====
local function addVipTag(character: Model)
	local head = character:WaitForChild("Head", 10)
	if not head or head:FindFirstChild("VIPTag") then
		return
	end

	local billboard = Instance.new("BillboardGui")
	billboard.Name = "VIPTag"
	billboard.Size = UDim2.fromOffset(120, 36)
	billboard.StudsOffset = Vector3.new(0, 2.5, 0)
	billboard.AlwaysOnTop = true

	local label = Instance.new("TextLabel")
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundTransparency = 1
	label.Text = "VIP"
	label.TextColor3 = Color3.fromRGB(255, 215, 0)
	label.TextStrokeTransparency = 0
	label.Font = Enum.Font.FredokaOne
	label.TextScaled = true
	label.Parent = billboard

	billboard.Parent = head
end

local function refreshVipTag(player: Player)
	local passes = ownedPasses[player]
	if passes and passes.VIP and player.Character then
		task.spawn(addVipTag, player.Character)
	end
end

-- ===== Game logic =====
local function addCoins(player: Player, amount: number)
	local data = sessionData[player]
	if not data then
		return
	end
	data.Coins += amount
	syncPlayer(player)
end

local function doRebirth(player: Player)
	local data = sessionData[player]
	data.Rebirths += 1
	data.Coins = 0
	data.ClickPower = 0
	syncPlayer(player)
	notify(player, "Rebirth complete! Coin multiplier is now x" .. Config.GetRebirthMultiplier(data.Rebirths))
end

clickEvent.OnServerEvent:Connect(function(player)
	local data = sessionData[player]
	if not data then
		return
	end

	-- Rate limit to stop exploiters from firing thousands of clicks.
	local now = os.clock()
	local window = clickWindows[player]
	if not window or now - window.start >= 1 then
		window = { start = now, count = 0 }
		clickWindows[player] = window
	end
	window.count += 1
	if window.count > Config.MaxClicksPerSecond then
		return
	end

	data.TotalClicks += 1
	addCoins(player, getClickValue(player))
end)

buyUpgradeFunc.OnServerInvoke = function(player)
	local data = sessionData[player]
	if not data then
		return false, "Data still loading..."
	end

	local cost = Config.GetUpgradeCost(data.ClickPower)
	if data.Coins < cost then
		return false, "Not enough coins! Need " .. Config.FormatNumber(cost)
	end

	data.Coins -= cost
	data.ClickPower += 1
	syncPlayer(player)
	return true, "Click Power upgraded to level " .. data.ClickPower
end

rebirthFunc.OnServerInvoke = function(player)
	local data = sessionData[player]
	if not data then
		return false, "Data still loading..."
	end

	local cost = Config.GetRebirthCost(data.Rebirths)
	if data.Coins < cost then
		return false, "Need " .. Config.FormatNumber(cost) .. " coins to rebirth"
	end

	doRebirth(player)
	return true, "Rebirthed!"
end

-- ===== Game passes =====
local function checkGamePasses(player: Player)
	local passes = {}
	for key, pass in Config.GamePasses do
		if pass.Id ~= 0 then
			local ok, owns = pcall(MarketplaceService.UserOwnsGamePassAsync, MarketplaceService, player.UserId, pass.Id)
			if ok and owns then
				passes[key] = true
			end
		end
	end
	ownedPasses[player] = passes
end

MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, passId, wasPurchased)
	if not wasPurchased then
		return
	end
	local key = passKeyById[passId]
	if not key or not ownedPasses[player] then
		return
	end

	ownedPasses[player][key] = true
	notify(player, "Thanks for buying " .. Config.GamePasses[key].Name .. "!")
	refreshVipTag(player)
	syncPlayer(player)
end)

-- ===== Developer products =====
-- Roblox calls this for every developer product purchase and retries until
-- it returns PurchaseGranted, so it must never grant the same receipt twice.
MarketplaceService.ProcessReceipt = function(receiptInfo)
	local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
	if not player then
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	local data = sessionData[player]
	if not data then
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	if data.Receipts[receiptInfo.PurchaseId] then
		return Enum.ProductPurchaseDecision.PurchaseGranted
	end

	local product = productById[receiptInfo.ProductId]
	if not product then
		warn("[GameServer] Unknown product id", receiptInfo.ProductId)
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	if product.InstantRebirth then
		doRebirth(player)
	elseif product.Coins then
		local reward = product.Coins * Config.GetRebirthMultiplier(data.Rebirths)
		addCoins(player, reward)
		notify(player, "+" .. Config.FormatNumber(reward) .. " coins! Thanks for your support!")
	end

	data.Receipts[receiptInfo.PurchaseId] = os.time()

	if saveData(player) then
		return Enum.ProductPurchaseDecision.PurchaseGranted
	end
	-- Reward is already applied and the receipt is recorded in memory, so a
	-- retry later in this session won't grant it twice.
	return Enum.ProductPurchaseDecision.NotProcessedYet
end

-- ===== Player lifecycle =====
local function onPlayerAdded(player: Player)
	local leaderstats = Instance.new("Folder")
	leaderstats.Name = "leaderstats"

	local coins = Instance.new("NumberValue")
	coins.Name = "Coins"
	coins.Parent = leaderstats

	local rebirths = Instance.new("IntValue")
	rebirths.Name = "Rebirths"
	rebirths.Parent = leaderstats

	leaderstats.Parent = player

	local ok, saved = loadData(player)
	if not ok then
		-- Never play on default data: the next save would wipe their progress.
		player:Kick("Could not load your data. Please rejoin in a moment.")
		return
	end
	if not player.Parent then
		return
	end

	sessionData[player] = reconcile(saved)
	checkGamePasses(player)

	player.CharacterAdded:Connect(function()
		refreshVipTag(player)
	end)
	refreshVipTag(player)

	syncPlayer(player)
	notify(player, "Welcome to " .. Config.GameName .. "!")
end

local function onPlayerRemoving(player: Player)
	saveData(player)
	sessionData[player] = nil
	ownedPasses[player] = nil
	clickWindows[player] = nil
end

Players.PlayerAdded:Connect(onPlayerAdded)
Players.PlayerRemoving:Connect(onPlayerRemoving)
for _, player in Players:GetPlayers() do
	task.spawn(onPlayerAdded, player)
end

game:BindToClose(function()
	if RunService:IsStudio() and next(sessionData) == nil then
		return
	end
	for _, player in Players:GetPlayers() do
		task.spawn(saveData, player)
	end
	task.wait(3)
end)

-- ===== Auto clicker & autosave loops =====
task.spawn(function()
	while true do
		task.wait(1)
		for player, passes in ownedPasses do
			if passes.AutoClicker and sessionData[player] then
				addCoins(player, getClickValue(player) * Config.AutoClicksPerSecond)
			end
		end
	end
end)

task.spawn(function()
	while true do
		task.wait(AUTOSAVE_INTERVAL)
		for _, player in Players:GetPlayers() do
			task.spawn(saveData, player)
		end
	end
end)
