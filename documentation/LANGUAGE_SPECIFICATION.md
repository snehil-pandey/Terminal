# Panfam OS — Native Language Specification (`.pf`)

**Version:** 1.0.0  
**Status:** Implemented & Verified in Panfam OS Kernel  
**Runtime:** Panfam Language Interpreter (PFR)  

---

## 1. Syntax & Language Features

### 1.1 Variables & Constants
```pf
let message = "Hello Panfam"
let count = 42
let ratio = 3.14159
let isActive = true
```

### 1.2 Functions
```pf
function add(a, b) -> Integer {
    return a + b
}

let result = add(15, 27)
print("Sum is:", result)
```

### 1.3 Classes & Object-Oriented Programming
```pf
class Greeter {
    init(prefix) {
        self.prefix = prefix
    }

    function sayHello(name) {
        return self.prefix + " " + name
    }
}

let g = Greeter("Welcome,")
print(g.sayHello("Snehil"))
```

### 1.4 Control Flow
```pf
let score = 85

if score > 80 {
    print("Grade: A")
} else {
    print("Grade: B")
}

let i = 0
while i < 5 {
    print("Iteration:", i)
    i = i + 1
}
```

### 1.5 Standard Library Modules
- **`print(...)`**: Formatted standard output stream.
- **`math.sqrt(n)`**, **`math.abs(n)`**, **`math.floor(n)`**, **`math.ceil(n)`**, **`math.pi`**.
- **`system.uname()`**, **`system.meminfo()`**, **`system.cpuinfo()`**.

---

## 2. Shell Toolchain CLI (`pf`)

Panfam OS provides the `pf` toolchain command inside PFSH:

```bash
# Run a .pf source script
[snehil@panfam ~]$ pf run my_app.pf

# Execute an inline .pf statement
[snehil@panfam ~]$ pf eval 'let x = 6 * 7; print("Output:", x)'

# Syntax-check without execution
[snehil@panfam ~]$ pf check my_app.pf

# Display toolchain version
[snehil@panfam ~]$ pf version
```
