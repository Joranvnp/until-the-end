local Player = {}
Player.__index = Player

function Player.new(x, y, team)
    local self = setmetatable({}, Player)
    self.x = x
    self.y = y
    self.width = 24
    self.height = 32
    self.team = team or TEAM_LEFT

    -- Physics
    self.vx = 0
    self.vy = 0
    self.onGround = false

    -- Stats
    self.health = 100
    self.maxHealth = 100
    self.energy = 100
    self.maxEnergy = 100
    self.miningForce = 5
    self.attackPower = 5

    -- Inventory
    self.inventory = {}

    return self
end

function Player:update(dt, tilemap)
    -- Horizontal movement
    local moveDir = 0
    if love.keyboard.isDown("left") or love.keyboard.isDown("a") then
        moveDir = moveDir - 1
    end
    if love.keyboard.isDown("right") or love.keyboard.isDown("d") then
        moveDir = moveDir + 1
    end

    self.vx = moveDir * PLAYER_SPEED

    -- Jump
    if self.onGround and (love.keyboard.isDown("space") or love.keyboard.isDown("up") or love.keyboard.isDown("w")) then
        self.vy = -PLAYER_JUMP_FORCE
        self.onGround = false
    end

    -- Apply gravity
    self.vy = self.vy + GRAVITY * dt

    -- Move and handle collisions
    self:moveX(self.vx * dt, tilemap)
    self:moveY(self.vy * dt, tilemap)
end

function Player:moveX(amount, tilemap)
    self.x = self.x + amount
    if amount > 0 then
        -- Moving right
        if self:collidesWithMap(tilemap) then
            self.x = math.floor((self.x + self.width) / TILE_SIZE) * TILE_SIZE - self.width - 0.01
            self.vx = 0
        end
    elseif amount < 0 then
        -- Moving left
        if self:collidesWithMap(tilemap) then
            self.x = math.ceil(self.x / TILE_SIZE) * TILE_SIZE + 0.01
            self.vx = 0
        end
    end
end

function Player:moveY(amount, tilemap)
    self.y = self.y + amount
    if amount > 0 then
        -- Moving down
        if self:collidesWithMap(tilemap) then
            self.y = math.floor((self.y + self.height) / TILE_SIZE) * TILE_SIZE - self.height - 0.01
            self.vy = 0
            self.onGround = true
        else
            self.onGround = false
        end
    elseif amount < 0 then
        -- Moving up
        if self:collidesWithMap(tilemap) then
            self.y = math.ceil(self.y / TILE_SIZE) * TILE_SIZE + 0.01
            self.vy = 0
        end
    end
end

function Player:collidesWithMap(tilemap)
    local left = math.floor(self.x / TILE_SIZE) + 1
    local right = math.floor((self.x + self.width - 0.01) / TILE_SIZE) + 1
    local top = math.floor(self.y / TILE_SIZE) + 1
    local bottom = math.floor((self.y + self.height - 0.01) / TILE_SIZE) + 1

    for ty = top, bottom do
        for tx = left, right do
            if tilemap:isSolid(tx, ty) then
                return true
            end
        end
    end
    return false
end

function Player:getCenter()
    return self.x + self.width / 2, self.y + self.height / 2
end

function Player:addToInventory(tileType)
    self.inventory[tileType] = (self.inventory[tileType] or 0) + 1
end

function Player:removeFromInventory(tileType)
    if self.inventory[tileType] and self.inventory[tileType] > 0 then
        self.inventory[tileType] = self.inventory[tileType] - 1
        if self.inventory[tileType] <= 0 then
            self.inventory[tileType] = nil
        end
        return true
    end
    return false
end

function Player:hasInInventory(tileType)
    return self.inventory[tileType] and self.inventory[tileType] > 0
end

function Player:draw(cameraX, cameraY)
    local drawX = self.x - cameraX
    local drawY = self.y - cameraY

    -- Draw player body
    if self.team == TEAM_LEFT then
        love.graphics.setColor(0.2, 0.4, 0.8, 1)
    else
        love.graphics.setColor(0.8, 0.2, 0.2, 1)
    end
    love.graphics.rectangle("fill", drawX, drawY, self.width, self.height)

    -- Draw outline
    love.graphics.setColor(0, 0, 0, 1)
    love.graphics.rectangle("line", drawX, drawY, self.width, self.height)

    -- Draw health bar
    local barWidth = self.width
    local barHeight = 4
    local barY = drawY - barHeight - 2

    love.graphics.setColor(0.3, 0.3, 0.3, 1)
    love.graphics.rectangle("fill", drawX, barY, barWidth, barHeight)

    love.graphics.setColor(0, 0.8, 0, 1)
    local healthPercent = self.health / self.maxHealth
    love.graphics.rectangle("fill", drawX, barY, barWidth * healthPercent, barHeight)

    love.graphics.setColor(1, 1, 1, 1)
end

return Player
