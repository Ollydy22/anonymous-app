        // Initialize Firebase
        const firebaseConfig = {
            apiKey: "AIzaSyCTIQV1KL75W7zw8AcJX5sF00Fdc8Y0tjk",
            authDomain: "anonymous-app-32575.firebaseapp.com",
            projectId: "anonymous-app-32575",
            storageBucket: "anonymous-app-32575.appspot.com",
            messagingSenderId: "730352688279",
            appId: "1:730352688279:web:719129794d1d5309315dd2"
        };
        firebase.initializeApp(firebaseConfig);

        // DOM elements
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const dashboard = document.getElementById('dashboard');
        const showRegisterLink = document.getElementById('showRegister');
        const showLoginLink = document.getElementById('showLogin');
        const userEmailSpan = document.getElementById('userEmail');
        const shareableLinkInput = document.getElementById('shareableLink');
        const copyLinkBtn = document.getElementById('copyLink');
        const messageList = document.getElementById('messageList');
        const sendMessageForm = document.getElementById('sendMessage');
        const logoutBtn = document.getElementById('logout');
        const googleLoginBtn = document.getElementById('googleLogin');

        // Show/hide forms
        showRegisterLink.addEventListener('click', () => {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        });

        showLoginLink.addEventListener('click', () => {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        });

        // Register
        document.getElementById('register').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            firebase.auth().createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    console.log('User registered:', userCredential.user);
                    showDashboard(userCredential.user);
                })
                .catch((error) => {
                    console.error('Registration error:', error);
                    alert(error.message);
                });
        });

        // Login
        document.getElementById('login').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            firebase.auth().signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    console.log('User logged in:', userCredential.user);
                    showDashboard(userCredential.user);
                })
                .catch((error) => {
                    console.error('Login error:', error);
                    alert(error.message);
                });
        });

        // Google Login
        googleLoginBtn.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithPopup(provider)
                .then((result) => {
                    console.log('Google login successful:', result.user);
                    showDashboard(result.user);
                })
                .catch((error) => {
                    console.error('Google login error:', error);
                    alert(error.message);
                });
        });

        // Logout
        logoutBtn.addEventListener('click', () => {
            firebase.auth().signOut()
                .then(() => {
                    console.log('User logged out');
                    showLoginForm();
                })
                .catch((error) => {
                    console.error('Logout error:', error);
                    alert(error.message);
                });
        });

        // Copy shareable link
        copyLinkBtn.addEventListener('click', () => {
            shareableLinkInput.select();
            document.execCommand('copy');
            alert('Link copied to clipboard!');
        });

        // Send message
        sendMessageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const messageText = document.getElementById('messageText').value;
            const user = firebase.auth().currentUser;
            if (user) {
                const messageRef = firebase.database().ref('messages').push();
                messageRef.set({
                    text: messageText,
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    senderId: null,
                    recipientId: user.uid
                })
                .then(() => {
                    console.log('Message sent successfully');
                    document.getElementById('messageText').value = '';
                })
                .catch((error) => {
                    console.error('Error sending message:', error);
                    alert(error.message);
                });
            }
        });

        // Show dashboard
        function showDashboard(user) {
            loginForm.style.display = 'none';
            registerForm.style.display = 'none';
            dashboard.style.display = 'block';
            userEmailSpan.textContent = user.email;
            shareableLinkInput.value = `${window.location.origin}/send-message.html?uid=${user.uid}`;
            loadMessages(user.uid);
        }

        // Show login form
        function showLoginForm() {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            dashboard.style.display = 'none';
        }

        // Load messages
        function loadMessages(userId) {
            const messagesRef = firebase.database().ref('messages');
            messagesRef.orderByChild('recipientId').equalTo(userId).on('value', (snapshot) => {
                messageList.innerHTML = '';
                snapshot.forEach((childSnapshot) => {
                    const message = childSnapshot.val();
                    const messageElement = document.createElement('div');
                    messageElement.classList.add('message');
                    messageElement.innerHTML = `
                        <p>${message.text}</p>
                        <small class="anonymous">Anonymous - ${new Date(message.timestamp).toLocaleString()}</small>
                    `;
                    messageList.appendChild(messageElement);
                });
            });
        }

        // Check auth state
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                showDashboard(user);
            } else {
                showLoginForm();
            }
        });