document.getElementById('userForm').addEventListener('submit', function(event) {
    event.preventDefault();
  
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const walletBalance = parseFloat(document.getElementById('walletBalance').value);
  
    if (isNaN(walletBalance)) {
      alert('Please enter a valid wallet balance');
      return;
    }
  
    // Send data to backend
    fetch('http://127.0.0.1:8000/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        email: email,
        phone_number: phone,
        wallet_balance: walletBalance,
      }),
    })
      .then(response => response.json())
      .then(data => {
        console.log('User added:', data);
        alert('User added successfully!');
        loadUsers();
      })
      .catch(error => {
        console.error('Error:', error);
        alert('There was an error adding the user.');
      });
  });
  
  document.getElementById('transactionForm').addEventListener('submit', function(event) {
    event.preventDefault();
  
    const transactionType = document.getElementById('transactionType').value;
    const amount = parseFloat(document.getElementById('amount').value);
  
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
  
    // Assuming user ID is pre-selected or fetched dynamically
    const userId = 'some-user-id'; // You can dynamically select user ID based on your UI
  
    // Send data to backend
    fetch('http://127.0.0.1:8000/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        transaction_type: transactionType,
        amount: amount,
      }),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Transaction added:', data);
        alert('Transaction added successfully!');
        loadTransactions();
      })
      .catch(error => {
        console.error('Error:', error);
        alert('There was an error adding the transaction.');
      });
  });
  
  function loadUsers() {
    fetch('http://127.0.0.1:8000/users')
      .then(response => response.json())
      .then(users => {
        console.log('Users:', users);  
        const tbody = document.getElementById('userTable').getElementsByTagName('tbody')[0];
        tbody.innerHTML = ''; 
        users.forEach(user => {
          const row = tbody.insertRow();
          row.insertCell(0).textContent = user.name;
          row.insertCell(1).textContent = user.email;
          row.insertCell(2).textContent = user.phone_number;
          row.insertCell(3).textContent = user.wallet_balance;
          const actionsCell = row.insertCell(4);
          const userId = user.id;
          console.log("no user id",user.id)
          actionsCell.innerHTML = `<button onclick="editUser('${userId}')">Edit</button> <button onclick="deleteUser('${userId}')">Delete</button>  <button onclick="viewTransactions('${userId}')">Add Transaction</button>` ;


        });
      });
  }
  
  function viewTransactions(userId) {
    // Open the transaction modal
    document.getElementById('transactionModal').style.display = 'block';
  
    // You can store the user ID for use in the transaction form if needed
    document.getElementById('transactionForm').onsubmit = function(event) {
      event.preventDefault();
  
      const transactionType = document.getElementById('transactionType').value;
      const amount = parseFloat(document.getElementById('amount').value);
  
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
      }
  
      // Send data to backend
      fetch('http://127.0.0.1:8000/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          transaction_type: transactionType,
          amount: amount,
        }),
      })
        .then(response => response.json())
        .then(data => {
          console.log('Transaction added:', data);
          alert('Transaction added successfully!');
          loadTransactions();
          closeTransactionModal(); // Close the modal
        })
        .catch(error => {
          console.error('Error:', error);
          alert('There was an error adding the transaction.');
        });
    };
    function closeTransactionModal() {
      document.getElementById('transactionModal').style.display = 'none';
    }
    
    // Close the modal when the user clicks the "X" button or anywhere outside the modal
    document.getElementById('closeTransactionModal').addEventListener('click', closeTransactionModal);
    window.addEventListener('click', function(event) {
      if (event.target === document.getElementById('transactionModal')) {
        closeTransactionModal();
      }
    });
  }
  
  function loadTransactions() {
    fetch('http://127.0.0.1:8000/transactions')
      .then(response => response.json())
      .then(transactions => {
        const tbody = document.getElementById('transactionTable').getElementsByTagName('tbody')[0];
        tbody.innerHTML = ''; // Clear the table
        transactions.forEach(transaction => {
          const row = tbody.insertRow();
          row.insertCell(0).textContent = transaction.user_id;
          row.insertCell(1).textContent = transaction.transaction_type;
          row.insertCell(2).textContent = transaction.amount;
          row.insertCell(3).textContent = new Date(transaction.timestamp).toLocaleString();
        });
      });
  }
  
  function editUser(userId) {
    // Fetch the user data by ID
    fetch(`http://127.0.0.1:8000/users/${userId}`)
      .then(response => response.json())
      .then(user => {
        // Populate the edit form with the user's data
        document.getElementById('editName').value = user.name;
        document.getElementById('editEmail').value = user.email;
        document.getElementById('editPhone').value = user.phone_number;
        document.getElementById('editWalletBalance').value = user.wallet_balance;
        
        // Show the edit modal
        document.getElementById('editUserModal').style.display = 'block';
  
        // Add event listener for the form submission
        document.getElementById('editUserForm').onsubmit = function(event) {
          event.preventDefault();
          
          const updatedUser = {
            name: document.getElementById('editName').value,
            email: document.getElementById('editEmail').value,
            phone_number: document.getElementById('editPhone').value,
            wallet_balance: parseFloat(document.getElementById('editWalletBalance').value),
          };
  
          // Send the updated user data to the backend
          fetch(`http://127.0.0.1:8000/users/${userId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedUser),
          })
            .then(response => response.json())
            .then(data => {
              console.log('User updated:', data);
              alert('User updated successfully!');
              loadUsers(); // Reload the users list
              closeModal(); // Close the modal
            })
            .catch(error => {
              console.error('Error:', error);
              alert('There was an error updating the user.');
            });
        };
      });
  }
  
  // Close the modal when the "Close" button or background is clicked
  function closeModal() {
    document.getElementById('editUserModal').style.display = 'none';
  }
  
  // Close the modal when the user clicks the "X" button
  document.getElementById('closeModal').addEventListener('click', closeModal);
  
  // Close the modal if the user clicks anywhere outside the modal
  window.addEventListener('click', function(event) {
    if (event.target === document.getElementById('editUserModal')) {
      closeModal();
    }
  });
  
  
  function deleteUser(userId) {
    if (!userId) {
        console.error("User ID is missing");
        return;
    }
    fetch(`http://127.0.0.1:8000/users/${userId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        console.log('User deleted:', data);
    })
    .catch(error => console.error('Error:', error));
}

  // Load initial data
  loadUsers();
  loadTransactions();
  