# Feature: 2D Base Defense & Resource Gathering Game

## Vision

A 2D side-scrolling strategy game developed in Lua with Love2D. Two teams (Left vs Right) compete to destroy each other's bases. Players control a character to navigate, mine terrain, build defenses, and gather resources to upgrade their base.

## Problem

We need to establish the core game loop and mechanics to validate the "Base vs Base" concept with mining and building elements.

## Solution

Implement a modular Love2D project containing:

- **Map System**: 2D grid-based tilemap supporting destruction (digging) and construction.
- **Player Controller**: Physics-based platformer controls (run, jump) with inventory management.
- **Teams**: Two distinct teams with bases located at opposite ends of the map.
- **Resources**: Resource distribution logic where higher value resources are concentrated in the center of the map.
- **AI**: A basic opponent AI to simulate gameplay for single-player testing.
- **Base Upgrades**: Mechanics to spend resources to improve base stats or capabilities.

## User Stories

1. **Map Generation**: Generate a playable 2D terrain with distinct block types (dirt, stone, valuable ores).
2. **Player Movement**: Control a character that can move left/right, jump, and collide with the map.
3. **Mining & Building**: Allow the player to remove tiles (digging) and place them back (building) using an inventory.
4. **Bases**: Instantiate a Base entity for each team that can take damage and be destroyed.
5. **Resource Loop**: Implement resource collection and a mechanism to "deposit" resources at the base for upgrades.
6. **Basic AI**: Create an AI controller that mimics basic player actions (moving towards objectives).

## Technical Notes

- **Engine**: Love2D (Lua).
- **Architecture**: Entity-Component-System (ECS) or Class-based structure for entities (Player, Base, AI).
- **Collision**: Use Love2D's physics module or a simple AABB custom implementation for tile collisions.
