const pizzaType = ['pepperoni', 'sausage', 'cheese']

const pizzaReceipt = new Promise((resolve, reject) => {
  console.log('Chef is preparing your order')
  setTimeout (()=> {
     if (pizzaType.includes('pepperoni')) {
    resolve('Able to complete the order')
  }
  else
    reject('cannot perform the order')
  },2000)
 
})

console.log(`Here is the order status ${pizzaReceipt}`)
console.log('---------------------------------------------------------')
pizzaReceipt.then((result) => {
  console.log(`The Chef tell you: ${result}`)
  return true
}).then((status)=> {
  if (status) {
    console.log('We can eat now')
  }
}).catch ((response) => {
  console.log(response)
})