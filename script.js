function calculate(operation) {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);
  let result = 0;

  if (isNaN(num1) || isNaN(num2)) {
    alert('Введите оба числа');
    return;
  }

  switch (operation) {
    case '+': result = num1 + num2; break;
    case '-': result = num1 - num2; break;
    case '*': result = num1 * num2; break;
    case '/': result = num2 !== 0 ? num1 / num2 : 'Ошибка (деление на 0)'; break;
  }

  document.getElementById('result').innerText = result;
}