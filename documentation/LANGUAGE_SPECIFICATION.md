# Panfam OS — Native Language Specification (`.pf`)

**Version:** 2.0.0  
**Status:** Implemented & Verified in Panfam OS Kernel  
**Runtime:** Panfam Language Interpreter (PFR)  
**Related Documents:** [ARCHITECTURE.md](./ARCHITECTURE.md) | [SECURITY.md](./SECURITY.md) | [TESTING.md](./TESTING.md)

---

## 1. Syntax & Language Features

### 1.1 Variables, Constants & Static Type Annotations
```pf
let message: String = "Hello Panfam OS"
let count: Integer = 42
let ratio: Float = 3.14159
let isActive: Boolean = true
let arbitrary: Any = "Dynamic payload"
```

### 1.2 Functions & Return Types
```pf
function add(a: Integer, b: Integer) -> Integer {
    return a + b
}

let result = add(15, 27)
print("Sum is:", result)
```

### 1.3 Object-Oriented Programming (Inheritance, Interfaces & `super`)
```pf
interface Drivable {
    function drive(speed: Integer) -> Void
}

class Vehicle {
    init(brand) {
        self.brand = brand
    }

    identify() {
        return "Brand: " + self.brand
    }
}

class SportsCar extends Vehicle implements Drivable {
    init(brand, maxSpeed) {
        super.init(brand)
        self.maxSpeed = maxSpeed
    }

    identify() {
        return super.identify() + " (Max: " + self.maxSpeed + " km/h)"
    }

    drive(speed) {
        print("Cruising at:", speed)
    }
}

let car = SportsCar("PanfamMotors", 320)
print(car.identify())
car.drive(120)
```

### 1.4 Exception Handling (`try`, `catch`, `finally`, `throw`)
```pf
try {
    if count > 40 {
        throw "Threshold exceeded"
    }
} catch err {
    print("Caught error:", err)
} finally {
    print("Cleanup actions completed")
}
```

### 1.5 Standard Library Modules
- **`print(...)`**: Formatted standard output stream.
- **`math`**: `math.sqrt(n)`, `math.abs(n)`, `math.floor(n)`, `math.ceil(n)`, `math.pi`.
- **`string`**: `string.length(s)`, `string.upper(s)`, `string.lower(s)`, `string.trim(s)`, `string.split(s, sep)`, `string.join(arr, sep)`, `string.replace(s, find, rep)`.
- **`collections`**: `collections.list()`, `collections.map()`, `collections.size(coll)`, `collections.push(arr, val)`, `collections.pop(arr)`, `collections.keys(map)`.
- **`time`**: `time.now()`, `time.iso()`.
- **`system`**: `system.uname()`, `system.meminfo()`, `system.cpuinfo()`.

---

## 2. Shell Toolchain CLI (`pf`)

Panfam OS provides the `pf` toolchain command inside PFSH:

```bash
# Run a .pf source script
[snehil@panfam ~]$ pf run my_app.pf

# Execute an inline .pf statement
[snehil@panfam ~]$ pf eval 'let x = 6 * 7; print("Output:", x)'

# Static type check & diagnostic audit
[snehil@panfam ~]$ pf check my_app.pf

# Deterministic source code formatting
[snehil@panfam ~]$ pf format my_app.pf

# Interactive Read-Eval-Print Loop
[snehil@panfam ~]$ pf repl

# Display toolchain version
[snehil@panfam ~]$ pf version
```
