-- Config (ModuleScript) -> ReplicatedStorage.Config
-- All game balance and monetization IDs live here.
-- Replace the 0s with the IDs you create on the Creator Dashboard.

local Config = {}

Config.GameName = "Click Tycoon Simulator"

-- ===== Economy =====
Config.BaseClickValue = 1 -- coins per click at Click Power level 0
Config.ClickPowerPerLevel = 1 -- extra coins per click for each upgrade level
Config.UpgradeBaseCost = 25
Config.UpgradeCostGrowth = 1.45 -- each level costs 45% more than the previous one

Config.RebirthBaseCost = 5000 -- coins needed for the first rebirth
Config.RebirthCostGrowth = 2.5 -- each rebirth costs 2.5x more than the previous one
Config.RebirthMultiplierBonus = 0.5 -- +50% coins per rebirth

Config.MaxClicksPerSecond = 20 -- anti auto-clicker exploit limit
Config.AutoClicksPerSecond = 5 -- clicks granted by the Auto Clicker game pass

-- ===== Game Passes (one-time purchase, permanent) =====
-- Create at: Creator Dashboard > your experience > Monetization > Passes
Config.GamePasses = {
	DoubleCoins = {
		Id = 0,
		Name = "2x Coins",
		Description = "Earn double coins forever!",
	},
	AutoClicker = {
		Id = 0,
		Name = "Auto Clicker",
		Description = "Clicks for you 5 times per second, even while AFK!",
	},
	VIP = {
		Id = 0,
		Name = "VIP",
		Description = "+50% coins and a shiny VIP tag over your head!",
	},
}

-- ===== Developer Products (can be bought again and again) =====
-- Create at: Creator Dashboard > your experience > Monetization > Developer Products
-- Coin rewards scale with the player's rebirth multiplier so packs stay useful.
Config.Products = {
	SmallCoins = {
		Id = 0,
		Name = "Pile of Coins",
		Coins = 2500,
	},
	MediumCoins = {
		Id = 0,
		Name = "Bag of Coins",
		Coins = 20000,
	},
	LargeCoins = {
		Id = 0,
		Name = "Vault of Coins",
		Coins = 150000,
	},
	InstantRebirth = {
		Id = 0,
		Name = "Instant Rebirth",
		InstantRebirth = true,
	},
}

-- ===== Helpers shared by server and client =====
function Config.GetUpgradeCost(level: number): number
	return math.floor(Config.UpgradeBaseCost * Config.UpgradeCostGrowth ^ level)
end

function Config.GetRebirthCost(rebirths: number): number
	return math.floor(Config.RebirthBaseCost * Config.RebirthCostGrowth ^ rebirths)
end

function Config.GetRebirthMultiplier(rebirths: number): number
	return 1 + rebirths * Config.RebirthMultiplierBonus
end

function Config.FormatNumber(n: number): string
	local suffixes = { "", "K", "M", "B", "T", "Qa", "Qi" }
	local i = 1
	while math.abs(n) >= 1000 and i < #suffixes do
		n /= 1000
		i += 1
	end
	if i == 1 then
		return tostring(math.floor(n))
	end
	return string.format("%.2f%s", n, suffixes[i])
end

return Config
