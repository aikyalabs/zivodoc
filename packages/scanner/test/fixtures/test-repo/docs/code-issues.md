# Code Issues

This file contains code blocks with various problems.

## Syntax Error

```javascript
const obj = {
  name: "test",
  value: 42,
```

## Runtime Error — TypeError

This block is self-contained and should trigger a runtime_error finding.

```javascript
var data = null;
data.toString();
```

## Runtime Error — ReferenceError (self-contained via var)

```javascript
var items = [1, 2, 3];
items.push(undefined);
var len = items.length;
var result = items[10].toFixed(2);
```

## Empty Code Block

```python
```

## Missing Language Tag

```
const server = express();
server.listen(3000);
console.log("running");
```

## Snippet — Should NOT Be Flagged

This uses undeclared identifiers (app, router) — the heuristic should skip it.

```javascript
app.get("/users", async (req, res) => {
  const users = await db.query("SELECT * FROM users");
  res.json(users);
});
```

## Skip Annotation

```javascript
// @zivodoc-skip
const broken = undefinedFunction();
broken.doStuff();
```

## Valid TypeScript (should be skipped by executor)

```typescript
interface User {
  id: string;
  name: string;
}
const user: User = { id: "1", name: "Test" };
```

## Valid Code — No Errors

```javascript
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
const sum = doubled.reduce((a, b) => a + b, 0);
console.log(sum);
```
