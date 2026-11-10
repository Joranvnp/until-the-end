---
title: Hoist callbacks to the root of lists
impact: HIGH
impactDescription: Fewer re-renders and faster lists
tags: list, performance, callbacks
---

## List performance callbacks

**Impact: HIGH (Fewer re-renders and faster lists)**

When passing callback functions to list items, create a single instance of the
callback at the root of the list. Items should then call it with a unique
identifier.

**Incorrect (creates a new callback on each render):**

```typescript
return (
  <LegendList
    renderItem={({ item }) => {
      // bad: creates a new callback on each render
      const onPress = () => handlePress(item.id)
      return <Item key={item.id} item={item} onPress={onPress} />
    }}
  />
)
```

**Correct (one stable function instance shared by every item):**

The hoisted callback takes the id as an argument, so it does not close over any
individual item and its identity stays stable across renders. The item calls it
back with its own id.

```typescript
const onPressItem = useCallback((id: string) => handlePress(id), [handlePress])

return (
  <LegendList
    renderItem={({ item }) => (
      <Item key={item.id} item={item} onPress={onPressItem} />
    )}
  />
)

// Item calls the shared callback with its own id:
//   <Pressable onPress={() => onPress(item.id)} />
// Memoize Item (see `list-performance-item-memo`) so the stable `onPress`
// actually prevents re-renders.
```
