# Session Notes

## Session: 2026-02-03

### Weapon Shop Implementation

**Completed:**
1. **Weapon Shop with Randomization**
   - Added weapon shop with Weapons/Armor/Units tabs
   - Weapons have randomized elements (40% none, 60% random element with 5-20% bonus)
   - Armor has randomized slots (70% 0-slot, 20% 1-slot, 8% 2-slot, 2% 3-slot)
   - Weak starter units (Knight/Power, Knight/Guard, Resist/Fire, etc.)
   - Refresh button regenerates shop inventory with new random seed

2. **PSO-Style Equipment Purchase**
   - Items removed from shop after purchase (one-time buy)
   - Equipment doesn't stack - each piece is a discrete inventory item
   - 40-slot inventory limit enforced
   - Buy buttons show "Full" when inventory at capacity

3. **City Menu Updates**
   - Added "Weapon Shop" button
   - Added disabled "Custom Shop" placeholder
   - Added "Man Hole" section with disabled:
     - Photon Collector
     - Enemy Collector

### Files Changed
- `src/systems/shop/shop.ts` - Added randomization functions, removeShopItem()
- `src/systems/shop/types.ts` - Added EquipmentShopItem interface
- `src/cli/api.ts` - Added buy-equipment command, inventory limits
- `src/cli/types.ts` - Added weapon-shop location, inventory slot fields
- `src/components/web/GamePlayWeb.tsx` - Weapon shop UI, city placeholders
- `src/systems/shop/shop.test.ts` - Updated tests for new structure

### Commits
- `5833ff2` - Add weapon shop with randomized equipment and city placeholders
- `0e08375` - Implement PSO-style equipment shop with inventory limits

### Next Steps / TODO
- [ ] Implement Custom Shop (player crafting/trading)
- [ ] Implement Photon Collector (exchange Photon Drops)
- [ ] Implement Enemy Collector (bestiary/monster data)
- [ ] Add sell functionality in weapon shop
- [ ] Consider weapon type restrictions per class
