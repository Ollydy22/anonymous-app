        // Initialize Firebase (use the same config as in the main app)
        const firebaseConfig = {
            apiKey: "AIzaSyCTIQV1KL75W7zw8AcJX5sF00Fdc8Y0tjk",
            authDomain: "anonymous-app-32575.firebaseapp.com",
            projectId: "anonymous-app-32575",
            storageBucket: "anonymous-app-32575.appspot.com",
            messagingSenderId: "730352688279",
            appId: "1:730352688279:web:719129794d1d5309315dd2"
        };
        firebase.initializeApp(firebaseConfig);

        const urlParams = new URLSearchParams(window.location.search);
        const recipientId = urlParams.get('uid');

        document.getElementById('sendMessage').addEventListener('submit', (e) => {
            e.preventDefault();
            const messageText = document.getElementById('messageText').value;
            const messageRef = firebase.database().ref('messages').push();
            messageRef.set({
                text: messageText,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                senderId: null,
                recipientId: recipientId
            })
            .then(() => {
                console.log('Anonymous message sent successfully');
                document.getElementById('messageText').value = '';
                document.getElementById('successMessage').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('successMessage').style.display = 'none';
                }, 3000);
            })
            .catch((error) => {
                console.error('Error sending message:', error);
                alert(error.message);
            });
        });