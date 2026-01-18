local Base = {}
Base.__index = Base

function Base.new(x, y, team)
    local self = setmetatable({}, Base)
    self.x = x
    self.y = y
    self.width = 64
    self.height = 96
    self.team = team

    self.health = 1000
    self.maxHealth = 1000

    -- Upgrades
    self.level = 1
    self.attackBonus = 0
    self.defenseBonus = 0
    self.miningBonus = 0

    -- Resources deposited
    self.resources = 0

    return self
end

function Base:takeDamage(amount)
    local actualDamage = math.max(1, amount - self.defenseBonus)
    self.health = math.max(0, self.health - actualDamage)
    return self.health <= 0
end

function Base:heal(amount)
    self.health = math.min(self.maxHealth, self.health + amount)
end

function Base:depositResources(amount)
    self.resources = self.resources + amount
end

function Base:isDestroyed()
    return self.health <= 0
end

function Base:getUpgradeCost()
    return self.level * 100
end

function Base:canUpgrade()
    return self.resources >= self:getUpgradeCost()
end

function Base:upgrade()
    if self:canUpgrade() then
        self.resources = self.resources - self:getUpgradeCost()
        self.level = self.level + 1
        self.maxHealth = self.maxHealth + 200
        self.health = self.maxHealth
        self.attackBonus = self.attackBonus + 2
        self.defenseBonus = self.defenseBonus + 1
        self.miningBonus = self.miningBonus + 1
        return true
    end
    return false
end

function Base:getBounds()
    return self.x, self.y, self.x + self.width, self.y + self.height
end

function Base:containsPoint(px, py)
    return px >= self.x and px < self.x + self.width and
           py >= self.y and py < self.y + self.height
end

function Base:draw(cameraX, cameraY)
    local drawX = self.x - cameraX
    local drawY = self.y - cameraY

    -- Draw base building
    if self.team == TEAM_LEFT then
        love.graphics.setColor(0.2, 0.3, 0.7, 1)
    else
        love.graphics.setColor(0.7, 0.2, 0.2, 1)
    end
    love.graphics.rectangle("fill", drawX, drawY, self.width, self.height)

    -- Draw roof
    if self.team == TEAM_LEFT then
        love.graphics.setColor(0.1, 0.2, 0.5, 1)
    else
        love.graphics.setColor(0.5, 0.1, 0.1, 1)
    end
    love.graphics.polygon("fill",
        drawX, drawY,
        drawX + self.width / 2, drawY - 20,
        drawX + self.width, drawY
    )

    -- Draw door
    love.graphics.setColor(0.3, 0.2, 0.1, 1)
    love.graphics.rectangle("fill", drawX + self.width / 2 - 10, drawY + self.height - 30, 20, 30)

    -- Draw windows
    love.graphics.setColor(0.8, 0.9, 1, 1)
    love.graphics.rectangle("fill", drawX + 10, drawY + 20, 15, 15)
    love.graphics.rectangle("fill", drawX + self.width - 25, drawY + 20, 15, 15)

    -- Draw health bar
    local barWidth = self.width
    local barHeight = 8
    local barY = drawY - 15

    love.graphics.setColor(0.3, 0.3, 0.3, 1)
    love.graphics.rectangle("fill", drawX, barY, barWidth, barHeight)

    local healthPercent = self.health / self.maxHealth
    if healthPercent > 0.5 then
        love.graphics.setColor(0, 0.8, 0, 1)
    elseif healthPercent > 0.25 then
        love.graphics.setColor(1, 0.8, 0, 1)
    else
        love.graphics.setColor(0.8, 0, 0, 1)
    end
    love.graphics.rectangle("fill", drawX, barY, barWidth * healthPercent, barHeight)

    -- Draw level indicator
    love.graphics.setColor(1, 1, 1, 1)
    love.graphics.print("Lv." .. self.level, drawX + self.width / 2 - 12, barY - 15)

    love.graphics.setColor(1, 1, 1, 1)
end

return Base
