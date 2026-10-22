-- ClientUI (LocalScript) -> StarterPlayer.StarterPlayerScripts.ClientUI
-- Builds the whole interface in code, so no manual GUI work is needed.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local MarketplaceService = game:GetService("MarketplaceService")
local TweenService = game:GetService("TweenService")

local Config = require(ReplicatedStorage:WaitForChild("Config"))
local remotes = ReplicatedStorage:WaitForChild("Remotes")
local clickEvent = remotes:WaitForChild("Click")
local dataUpdatedEvent = remotes:WaitForChild("DataUpdated")
local notifyEvent = remotes:WaitForChild("Notify")
local buyUpgradeFunc = remotes:WaitForChild("BuyUpgrade")
local rebirthFunc = remotes:WaitForChild("Rebirth")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local state = nil -- latest data from the server

-- ===== UI helpers =====
local function corner(parent: Instance, radius: number?)
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, radius or 12)
	c.Parent = parent
end

local function stroke(parent: Instance, color: Color3, thickness: number?)
	local s = Instance.new("UIStroke")
	s.Color = color
	s.Thickness = thickness or 3
	s.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
	s.Parent = parent
end

local function makeButton(parent: Instance, text: string, color: Color3): TextButton
	local button = Instance.new("TextButton")
	button.BackgroundColor3 = color
	button.Text = text
	button.TextColor3 = Color3.new(1, 1, 1)
	button.Font = Enum.Font.FredokaOne
	button.TextScaled = true
	button.AutoButtonColor = true
	corner(button)
	stroke(button, Color3.new(0, 0, 0), 2)
	local pad = Instance.new("UIPadding")
	pad.PaddingTop = UDim.new(0, 6)
	pad.PaddingBottom = UDim.new(0, 6)
	pad.PaddingLeft = UDim.new(0, 8)
	pad.PaddingRight = UDim.new(0, 8)
	pad.Parent = button
	button.Parent = parent
	return button
end

local function makeLabel(parent: Instance, text: string): TextLabel
	local label = Instance.new("TextLabel")
	label.BackgroundTransparency = 1
	label.Text = text
	label.TextColor3 = Color3.new(1, 1, 1)
	label.TextStrokeTransparency = 0.3
	label.Font = Enum.Font.FredokaOne
	label.TextScaled = true
	label.Parent = parent
	return label
end

local function pop(guiObject: GuiObject, baseSize: UDim2)
	local grown = UDim2.new(
		baseSize.X.Scale * 1.08,
		baseSize.X.Offset * 1.08,
		baseSize.Y.Scale * 1.08,
		baseSize.Y.Offset * 1.08
	)
	local up = TweenService:Create(guiObject, TweenInfo.new(0.06), { Size = grown })
	local down = TweenService:Create(guiObject, TweenInfo.new(0.08), { Size = baseSize })
	up:Play()
	up.Completed:Once(function(playbackState)
		if playbackState == Enum.PlaybackState.Completed then
			down:Play()
		end
	end)
end

-- ===== Root =====
local screen = Instance.new("ScreenGui")
screen.Name = "ClickTycoonUI"
screen.ResetOnSpawn = false
screen.IgnoreGuiInset = true
screen.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
screen.Parent = playerGui

-- ===== Top stats bar =====
local statsFrame = Instance.new("Frame")
statsFrame.AnchorPoint = Vector2.new(0.5, 0)
statsFrame.Position = UDim2.new(0.5, 0, 0, 50)
statsFrame.Size = UDim2.new(0.5, 0, 0, 90)
statsFrame.BackgroundColor3 = Color3.fromRGB(30, 30, 45)
statsFrame.BackgroundTransparency = 0.2
corner(statsFrame, 16)
stroke(statsFrame, Color3.fromRGB(255, 200, 0))
statsFrame.Parent = screen

local sizeLimit = Instance.new("UISizeConstraint")
sizeLimit.MinSize = Vector2.new(260, 0)
sizeLimit.MaxSize = Vector2.new(520, math.huge)
sizeLimit.Parent = statsFrame

local coinsLabel = makeLabel(statsFrame, "Coins: 0")
coinsLabel.Size = UDim2.new(1, -20, 0.6, 0)
coinsLabel.Position = UDim2.new(0, 10, 0, 4)
coinsLabel.TextColor3 = Color3.fromRGB(255, 220, 60)

local infoLabel = makeLabel(statsFrame, "Per click: 1  |  Rebirths: 0")
infoLabel.Size = UDim2.new(1, -20, 0.35, 0)
infoLabel.Position = UDim2.new(0, 10, 0.6, 0)

-- ===== Big click button =====
local clickButton = makeButton(screen, "CLICK!", Color3.fromRGB(255, 170, 0))
clickButton.AnchorPoint = Vector2.new(0.5, 0.5)
clickButton.Position = UDim2.fromScale(0.5, 0.55)
local CLICK_SIZE = UDim2.fromOffset(220, 220)
clickButton.Size = CLICK_SIZE
clickButton:FindFirstChildOfClass("UICorner").CornerRadius = UDim.new(0.5, 0)
local clickStroke = clickButton:FindFirstChildOfClass("UIStroke")
clickStroke.Thickness = 6
clickStroke.Color = Color3.fromRGB(180, 90, 0)

-- ===== Bottom action buttons =====
local actions = Instance.new("Frame")
actions.AnchorPoint = Vector2.new(0.5, 1)
actions.Position = UDim2.new(0.5, 0, 1, -20)
actions.Size = UDim2.new(0.9, 0, 0, 70)
actions.BackgroundTransparency = 1
actions.Parent = screen

local actionsLimit = Instance.new("UISizeConstraint")
actionsLimit.MaxSize = Vector2.new(720, 70)
actionsLimit.Parent = actions

local actionsLayout = Instance.new("UIListLayout")
actionsLayout.FillDirection = Enum.FillDirection.Horizontal
actionsLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
actionsLayout.Padding = UDim.new(0.02, 0)
actionsLayout.Parent = actions

local upgradeButton = makeButton(actions, "Upgrade", Color3.fromRGB(60, 170, 80))
upgradeButton.Size = UDim2.fromScale(0.32, 1)

local rebirthButton = makeButton(actions, "Rebirth", Color3.fromRGB(150, 70, 220))
rebirthButton.Size = UDim2.fromScale(0.32, 1)

local shopButton = makeButton(actions, "SHOP", Color3.fromRGB(0, 170, 255))
shopButton.Size = UDim2.fromScale(0.32, 1)

-- ===== Notification toast =====
local toast = makeLabel(screen, "")
toast.AnchorPoint = Vector2.new(0.5, 0)
toast.Position = UDim2.new(0.5, 0, 0, 150)
toast.Size = UDim2.new(0.6, 0, 0, 36)
toast.TextTransparency = 1
toast.TextStrokeTransparency = 1

local toastToken = 0
local function showToast(message: string)
	toastToken += 1
	local token = toastToken
	toast.Text = message
	toast.TextTransparency = 0
	toast.TextStrokeTransparency = 0.3
	task.delay(2.5, function()
		if token == toastToken then
			TweenService:Create(toast, TweenInfo.new(0.4), { TextTransparency = 1, TextStrokeTransparency = 1 }):Play()
		end
	end)
end

-- ===== Floating "+N" text =====
local function floatText(text: string)
	local label = makeLabel(screen, text)
	label.TextColor3 = Color3.fromRGB(255, 230, 80)
	label.Size = UDim2.fromOffset(160, 40)
	label.AnchorPoint = Vector2.new(0.5, 0.5)
	label.Position = UDim2.new(0.5, math.random(-90, 90), 0.55, math.random(-60, 0))
	local tween = TweenService:Create(label, TweenInfo.new(0.8, Enum.EasingStyle.Quad), {
		Position = label.Position - UDim2.fromOffset(0, 90),
		TextTransparency = 1,
		TextStrokeTransparency = 1,
	})
	tween:Play()
	tween.Completed:Once(function()
		label:Destroy()
	end)
end

-- ===== Shop window =====
local shop = Instance.new("Frame")
shop.AnchorPoint = Vector2.new(0.5, 0.5)
shop.Position = UDim2.fromScale(0.5, 0.5)
shop.Size = UDim2.fromScale(0.7, 0.7)
shop.BackgroundColor3 = Color3.fromRGB(25, 25, 40)
shop.Visible = false
shop.ZIndex = 10
corner(shop, 18)
stroke(shop, Color3.fromRGB(0, 170, 255), 4)
shop.Parent = screen

local shopLimit = Instance.new("UISizeConstraint")
shopLimit.MaxSize = Vector2.new(640, 560)
shopLimit.Parent = shop

local shopTitle = makeLabel(shop, "ROBUX SHOP")
shopTitle.Size = UDim2.new(1, -80, 0, 44)
shopTitle.Position = UDim2.fromOffset(16, 10)
shopTitle.TextXAlignment = Enum.TextXAlignment.Left
shopTitle.ZIndex = 11

local closeButton = makeButton(shop, "X", Color3.fromRGB(220, 60, 60))
closeButton.Size = UDim2.fromOffset(44, 44)
closeButton.AnchorPoint = Vector2.new(1, 0)
closeButton.Position = UDim2.new(1, -10, 0, 10)
closeButton.ZIndex = 11

local list = Instance.new("ScrollingFrame")
list.Position = UDim2.fromOffset(12, 64)
list.Size = UDim2.new(1, -24, 1, -76)
list.BackgroundTransparency = 1
list.ScrollBarThickness = 6
list.AutomaticCanvasSize = Enum.AutomaticSize.Y
list.CanvasSize = UDim2.new()
list.ZIndex = 11
list.Parent = shop

local listLayout = Instance.new("UIListLayout")
listLayout.Padding = UDim.new(0, 8)
listLayout.SortOrder = Enum.SortOrder.LayoutOrder
listLayout.Parent = list

local passButtons = {} -- [passKey] = TextButton

local function addSectionHeader(text: string, order: number)
	local header = makeLabel(list, text)
	header.Size = UDim2.new(1, 0, 0, 30)
	header.TextXAlignment = Enum.TextXAlignment.Left
	header.TextColor3 = Color3.fromRGB(0, 200, 255)
	header.LayoutOrder = order
	header.ZIndex = 12
end

local function addShopRow(title: string, subtitle: string, order: number, color: Color3, onBuy: () -> ()): TextButton
	local row = Instance.new("Frame")
	row.Size = UDim2.new(1, -8, 0, 70)
	row.BackgroundColor3 = Color3.fromRGB(45, 45, 65)
	row.LayoutOrder = order
	row.ZIndex = 12
	corner(row)
	row.Parent = list

	local titleLabel = makeLabel(row, title)
	titleLabel.Size = UDim2.new(0.65, -12, 0.55, 0)
	titleLabel.Position = UDim2.fromOffset(12, 4)
	titleLabel.TextXAlignment = Enum.TextXAlignment.Left
	titleLabel.ZIndex = 13

	local subLabel = makeLabel(row, subtitle)
	subLabel.Size = UDim2.new(0.65, -12, 0.38, 0)
	subLabel.Position = UDim2.new(0, 12, 0.56, 0)
	subLabel.TextXAlignment = Enum.TextXAlignment.Left
	subLabel.TextColor3 = Color3.fromRGB(200, 200, 210)
	subLabel.ZIndex = 13

	local buy = makeButton(row, "BUY", color)
	buy.AnchorPoint = Vector2.new(1, 0.5)
	buy.Position = UDim2.new(1, -10, 0.5, 0)
	buy.Size = UDim2.new(0.32, 0, 0, 48)
	buy.ZIndex = 13
	buy.Activated:Connect(onBuy)
	return buy
end

local function setPrice(button: TextButton, id: number, infoType: Enum.InfoType)
	if id == 0 then
		button.Text = "Set ID"
		return
	end
	task.spawn(function()
		local ok, info = pcall(MarketplaceService.GetProductInfo, MarketplaceService, id, infoType)
		if ok and info and info.PriceInRobux and button.Text ~= "OWNED" then
			button.Text = "R$ " .. info.PriceInRobux
		end
	end)
end

local order = 0
local function nextOrder(): number
	order += 1
	return order
end

addSectionHeader("Game Passes (forever)", nextOrder())
for _, key in { "DoubleCoins", "AutoClicker", "VIP" } do
	local pass = Config.GamePasses[key]
	local button = addShopRow(pass.Name, pass.Description, nextOrder(), Color3.fromRGB(0, 180, 90), function()
		if pass.Id == 0 then
			showToast("This pass isn't set up yet (Config.lua)")
			return
		end
		if state and state.Passes[key] then
			showToast("You already own " .. pass.Name .. "!")
			return
		end
		MarketplaceService:PromptGamePassPurchase(player, pass.Id)
	end)
	setPrice(button, pass.Id, Enum.InfoType.GamePass)
	passButtons[key] = button
end

addSectionHeader("Boosts", nextOrder())
for _, key in { "SmallCoins", "MediumCoins", "LargeCoins", "InstantRebirth" } do
	local product = Config.Products[key]
	local subtitle = if product.InstantRebirth
		then "Rebirth now without spending coins!"
		else "+" .. Config.FormatNumber(product.Coins) .. " coins (x your rebirth bonus)"
	local button = addShopRow(product.Name, subtitle, nextOrder(), Color3.fromRGB(255, 140, 0), function()
		if product.Id == 0 then
			showToast("This product isn't set up yet (Config.lua)")
			return
		end
		MarketplaceService:PromptProductPurchase(player, product.Id)
	end)
	setPrice(button, product.Id, Enum.InfoType.Product)
end

-- ===== Wiring =====
local function render()
	if not state then
		return
	end
	coinsLabel.Text = "Coins: " .. Config.FormatNumber(state.Coins)
	infoLabel.Text = string.format(
		"Per click: %s  |  x%s  |  Rebirths: %d",
		Config.FormatNumber(state.ClickValue),
		tostring(math.floor(state.Multiplier * 100) / 100),
		state.Rebirths
	)
	upgradeButton.Text = "Upgrade\n" .. Config.FormatNumber(state.UpgradeCost)
	rebirthButton.Text = "Rebirth\n" .. Config.FormatNumber(state.RebirthCost)

	for key, button in passButtons do
		if state.Passes[key] then
			button.Text = "OWNED"
			button.BackgroundColor3 = Color3.fromRGB(90, 90, 100)
		end
	end
end

dataUpdatedEvent.OnClientEvent:Connect(function(newState)
	state = newState
	render()
end)

notifyEvent.OnClientEvent:Connect(showToast)

clickButton.Activated:Connect(function()
	clickEvent:FireServer()
	pop(clickButton, CLICK_SIZE)
	if state then
		floatText("+" .. Config.FormatNumber(state.ClickValue))
	end
end)

upgradeButton.Activated:Connect(function()
	local _, message = buyUpgradeFunc:InvokeServer()
	showToast(message)
end)

rebirthButton.Activated:Connect(function()
	local _, message = rebirthFunc:InvokeServer()
	showToast(message)
end)

shopButton.Activated:Connect(function()
	shop.Visible = not shop.Visible
end)

closeButton.Activated:Connect(function()
	shop.Visible = false
end)
