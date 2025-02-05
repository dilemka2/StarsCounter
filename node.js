const express = require('express');
const hbs = require('hbs');
const path = require('path');
const multer = require('multer');
const { urlencoded } = require('body-parser');
const dotenv = require('dotenv');
const session = require('express-session');

// sending email
const nodemailer = require('nodemailer');


const app = express();
dotenv.config({ path: '.env' });

// database
const mysql = require('mysql2');

app.use(session({
    secret: 'key',
    resave: false,
    saveUninitialized: false,
    cookie: {secure:false}
}))

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database:process.env.DATABASE,
})


db.connect((e) => {
    if (error) {
        console.log(error);
    }
    else {
        console.log('connected')
    }
})
// working with photos
let getColors = require('get-image-colors');
let { Image } = require('image-js');
const { error } = require('console');
const { inflate } = require('zlib');


app.set('view engine' , 'hbs');
app.set('views');
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true}))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname); 
        cb(null, file.originalname); 
    }
});

const upload = multer({ storage })

app.get('/', (req,res) => {
    res.render('index');
})

// routing
app.get('/login', (req,res) => {
    res.render('login');
})

app.get('/register', (req,res) => {
    res.render('register');
})

let login;
let password;
let email;

app.post('/register', async(req,res) =>{
    try {
        login = req.body.login;
        password = req.body.password;
        email = req.body.email;

        let sqlCheckerEmail = 'SELECT * FROM space WHERE email = ?';
        db.query(sqlCheckerEmail, email, async(err,result) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Something went wrong during checking password the email');
            }
            if (result.length>0) {
                return res.render('register', {
                    message:'this email is already used'
                })
            } 

            let user = {
                email: email,
                login: login,
                password: password 
            }

            let sqlInsertInto = 'INSERT INTO space SET ?';
            let query = db.query(sqlInsertInto, user, (err) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send('Something went wrong')
                }
            })
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER ,
                    pass: process.env.EMAIL_PASS,
                }
            })

            const mailOption = {
                from: process.env.EMAIL_USER,
                to: req.body.email,
                subject: 'Welcome to Our Service!',
                text: `Hi ${login},\n\nThank you for registering! Your account has been successfully created.\n\nBest regards,\ngo to count those stars!`
            }

            transporter.sendMail(mailOption, (error, info) => {
                if (error) {
                    console.log(error);
                }
                else {
                    console.log('the email has just been sent')
                }
            })
            res.redirect('/login');
        })
    }
    catch(e) {
        console.log(e);
    }
})      

app.post('/login', async(req,res) => {
    try {
        let sqlChecker = 'SELECT * FROM space WHERE email = ?';
        db.query(sqlChecker, login, (err, result) => {
            if (err) {
                return res.status(500).send('something went wrong during cheking te email');
            }
            if (result.length === 0) {
                return res.redirect('/login', {
                    message: 'There is no account with that login'
                })
            }
            let user = result[0];
            if (password != user.password) {
                return res.render('/login', {
                    message: 'Wrong password'
                })
            }
            if (password == user.password) {
                res.render('index', {account: 'is',})
                req.session.userId = user.id;
                console.log('works')
            }
        })
    }
    catch(e) {
        console.log(e);
    }
})


app.post('/send-photo', upload.single('photo') ,async (req,res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    const photo = req.file.filename;
    let filePath = path.join(__dirname, 'uploads', photo);
    let ImageGrey;
    async function makingGrey(filePath) {
        try {
            Image = await Image.load(filePath);
            ImageGrey = Image.grey();
            await ImageGrey.save(filePath+'-grey.jpg');
        }
        catch(e) {
            console.log(e)
        }
    }
    let succesGrayin = await makingGrey(filePath) 

    if (succesGrayin) {
        const whiteObjectsCounter = await countWhiteObjects(ImageGrey);
        res.json({
            message: 'File successfully processed',
            greyImagePath,
            whiteObjectsCount
        });
    }else {
        res.status(500).json({ error: 'Error processing the image.' });  
    }

})



const port = 3030;

app.listen(port, () => {
    console.log('the server has just been started');
})