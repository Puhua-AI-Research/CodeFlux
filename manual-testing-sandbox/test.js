class Calculator {
  constructor() {
    this.result = 0;
  }

  add(number) {
    this.result += number;
    return this;
  }

  subtract(number) {
    this.result -= number;
    return this;
  }

  multiply(number) {
    this.result *= number;
    return this;
  }
  
  divide(number) {
    if (number === 0) {
      throw new Error("Cannot divide by zero");
    }
    this.result /= number;
    return this;
  }

  getResult() {
    return this.result;
  }

  reset() {
    this.result = 0;
    return this;
  }
}
  
// test.js
const calculator = new Calculator();

console.log(calculator.add(5).subtract(3).multiply(2).divide(4).getResult()); // should return 1
calculator.reset();