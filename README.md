# MiTeC

MiTeC - Microsoft Teams Clone developed as a part of the Microsoft Engage 2021 Program.

##Please follow these steps to run the application on your machine :

1. Clone this repository to your system
2. Create a virtual environmnet in the project directory (`python3 -m venv venv`)
3. Activate the virtual environment (`. venv/bin/activate`)
4. Install the project requirements (`pip3 install -r requirements.txt`)
5. Head to Twilio and create a new [Twilio Account](https://www.twilio.com/try-twilio) or login if you already have one
6. Create an [API Key](https://www.twilio.com/console/project/api-keys) for your project. Please note down the **secret** as it is only displayed once
7. Copy the **.env.template** file into a file called **.env** and open it in your favourite text editor
8. Head to your Twilio account and enter the *TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET* in the .env file (Note that the contents in the .env file should never be made public)
9. Now, make sure that your environment is activated and type `python3 app.py` to start the server
10. MiTeC is now functional on localhost. Head to [http://localhost:5000](http://localhost:5000) to view the app
11. In order to make the app work from a different computer/mobile phone, a secure HTTPS connection is needed to give access to the WebRTC media APIs. You can use ngrok to get a temporary URL and test the app
12. For this, install [ngrok](https://ngrok.com/) and type `ngrok http 5000` in the terminal
13. Copy the secure link (with *https://*) and share it with your friends

MiTeC has been deployed on Heroku and can be accessed [here](https://mitec-engage.herokuapp.com)

Once on the website, click on *Take me to the Meeting Room* and follow the instructions to have a wonderful meeting experience

###Note

1. **Browser Compatibility** - MiTeC works best on Google Chrome when cookies are enabled. If there's a connection failure, please enable cookies and try again. MiTeC can also work on Safari, Firefox and Edge with adequate browser settings
2. **Device Compatibility** - For the best experience, use MiTeC on a laptop/desktop. The app can also be accessed and used through a Tablet/Mobile Phone
