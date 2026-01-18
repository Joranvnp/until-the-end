-- Game constants
TILE_SIZE = 32
MAP_WIDTH = 50
MAP_HEIGHT = 30

-- Tile types
TILE_EMPTY = 0
TILE_DIRT = 1
TILE_STONE = 2
TILE_ORE_COPPER = 3
TILE_ORE_SILVER = 4
TILE_ORE_GOLD = 5

-- Tile colors (RGBA)
TILE_COLORS = {
    [TILE_EMPTY] = {0, 0, 0, 0},
    [TILE_DIRT] = {0.6, 0.4, 0.2, 1},
    [TILE_STONE] = {0.5, 0.5, 0.5, 1},
    [TILE_ORE_COPPER] = {0.8, 0.5, 0.2, 1},
    [TILE_ORE_SILVER] = {0.75, 0.75, 0.8, 1},
    [TILE_ORE_GOLD] = {1.0, 0.84, 0.0, 1},
}

-- Tile resource values
TILE_VALUES = {
    [TILE_EMPTY] = 0,
    [TILE_DIRT] = 1,
    [TILE_STONE] = 2,
    [TILE_ORE_COPPER] = 5,
    [TILE_ORE_SILVER] = 10,
    [TILE_ORE_GOLD] = 25,
}

-- Player constants
PLAYER_SPEED = 200
PLAYER_JUMP_FORCE = 400
GRAVITY = 800

-- Team constants
TEAM_LEFT = 1
TEAM_RIGHT = 2
