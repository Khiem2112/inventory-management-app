const response = await fetch (`/login?Username=${username}&Password=${password}`, 
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
      })
console.log(response.json())