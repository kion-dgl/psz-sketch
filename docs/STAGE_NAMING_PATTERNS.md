# Stage Naming Patterns and Gate Configurations

This document describes the naming conventions used for stage maps and their relationship to gate configurations and directions.

## Overview

Each stage map follows a naming pattern: `{area_prefix}{type_prefix}{variant}`

- **Area prefix**: `s01` (Valley), `s02` (Wetlands), `s03` (Snowfield), etc.
- **Type prefix**: Two-letter code indicating layout type (e.g., `ib`, `xb`, `na`)
- **Variant**: Alphanumeric suffix for variations (e.g., `1`, `2`, `_ia1`)

## Type Prefix Reference

| Prefix | Full Name | Gate Count | Gate Directions | Description |
|--------|-----------|------------|-----------------|-------------|
| `ga` | Gateway | 1-2 | Varies | Entry/exit points to area |
| `ib` | Inner Bridge | 2 | North + South | Linear north-south passage |
| `ic` | Inner Canyon | 2 | North + South | Linear north-south passage (canyon variant) |
| `lb` | Lower Bridge | 2 | North + East | L-shaped turn (NE corner) |
| `lc` | Lower Canyon | 1-2 | North + East or North only | L-shaped turn or dead end |
| `na` | North Area | 1 | South only | Dead end, enters from south |
| `nb` | North Bridge | 1 | South only | Dead end (bridge variant) |
| `nc` | North Canyon | 1 | South only | Dead end (canyon variant) |
| `sa` | South Area | 1-2 | South only or North + South | Southern terminus or passage |
| `tb` | Top Bridge | 3 | West + East + South | T-junction, no north exit |
| `tc` | Top Canyon | 3 | West + East + South | T-junction (canyon variant) |
| `td` | Top Domain | 3 | East + South + West | T-junction variant |
| `xb` | Cross Bridge | 4 | North + South + East + West | 4-way crossroads |

## Layout Categories

### Linear Passages (2 gates)
- **`ib`** and **`ic`**: Straight corridors connecting north to south
- Used as connectors between major areas

### L-Turns (2 gates)
- **`lb`** and **`lc`**: Corner pieces connecting north to east
- Creates right-angle turns in the map layout

### Dead Ends (1 gate)
- **`na`**, **`nb`**, **`nc`**: Terminal rooms with only a south entrance
- Often contain objectives, items, or boss encounters

### T-Junctions (3 gates)
- **`tb`**, **`tc`**, **`td`**: Three-way intersections
- Typically missing the north gate (south, east, west only)
- Creates branching paths

### Crossroads (4 gates)
- **`xb`**: Full 4-way intersection
- Major hub areas connecting multiple paths

## Stage Areas

| Prefix | Area Name | Notes |
|--------|-----------|-------|
| `s01` | Gurhacia Valley | Starting area |
| `s02` | Ozette Wetlands | Swamp/marsh theme |
| `s03` | Rioh Snowfield | Snow/ice theme |
| `s04` | Makara Ruins | Underground ruins |
| `s05` | Oblivion City Paru | Overgrown city |
| `s06` | Arca Plant | Industrial facility |
| `s07` | Dark Shrine | Special shrine maps |
| `s08` | Eternal Tower | Vertical tower structure |

## Examples

```
s01b_ib1  = Valley, Inner Bridge, variant 1
s02e_xb2  = Wetlands, Cross Bridge, variant 2 (area e)
s03a_na1  = Snowfield, North Area (dead end), variant 1
```

## Gate Position Convention

Gates are positioned at fixed offsets from the map center:
- **North**: z = -27 (spawn at z = -24, trigger at z = -29)
- **South**: z = +27 (spawn at z = +24, trigger at z = +29)
- **East**: x = +27 (spawn at x = +24, trigger at x = +29)
- **West**: x = -27 (spawn at x = -24, trigger at x = -29)

The x/z coordinate along the edge varies per map based on terrain.

## Spawn Rotations

Players spawn facing into the map:
- **North gate**: rotation = 0 (facing south)
- **South gate**: rotation = PI (facing north)
- **East gate**: rotation = -PI/2 (facing west)
- **West gate**: rotation = PI/2 (facing east)
