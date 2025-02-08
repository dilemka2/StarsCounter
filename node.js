const express = require('express');
const hbs = require('hbs');
const path = require('path');
const multer = require('multer');
const { urlencoded } = require('body-parser');
const dotenv = require('dotenv');
const session = require('express-session');
const fs = require('fs');

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
    if (e) {
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

hbs.registerHelper('ifEquals', function(value, compareValue, options) {
    if (value === compareValue) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
})

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
// routing
app.get('/', (req,res) => {
    if(req.session.userId) {
        res.render('index', {account: 'is', login:login});
    }
    res.render('index');
})


app.get('/profile', (req,res) => {
    if(!req.session.userId) {
        res.render('index');
    }
    fs.readFile(`users_info/${login}.JSON`, 'utf-8', (err,data) => {
        if (err) {
         console.error('Ошибка чтения файла:', err);
        }
        const profileData = JSON.parse(data);
        res.render('profile', { 
            login: login,
            description: profileData.des,
            img: profileData.img,
            des: 'exist',
            imgE: 'exist',
            account: 'is',
        });
     })
})

app.get('/login', (req,res) => {
    res.render('login');
})

app.get('/register', (req,res) => {
    res.render('register');
})

app.get('/logout', async(req,res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Не удалось завершить сессию');
        }
        res.redirect('/');
    });
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
            const userInfo = {
                img:'',
                des: '',
            }
            const userInfoJson = JSON.stringify(userInfo, null, 2);
            await fs.writeFile(`users_info/${login}.JSON`, userInfoJson, () => {
                console.log('has just been created');
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
        let sqlChecker = 'SELECT * FROM space WHERE login = ?';
        db.query(sqlChecker, req.body.login, (err, result) => {
            if (err) {
                return res.status(500).send('something went wrong during cheking the email');
            }
            if (result.length === 0) {
                return res.render('login', {
                    message: 'There is no account with that login'
                })
            }
            let user = result[0];
            if (req.body.password != user.password) {
                return res.render('login', {
                    message: 'Wrong password'
                })
            }
            // adding info
            
            if (password == user.password) {
                res.render('index', {account: 'is', login:login})
                req.session.userId = user.id;
                console.log('works')
            }
        })
    }
    catch(e) {
        console.log(e);
    }
})


let profilePic;
let profileDesc;
app.post('/send-photo', upload.single('photo') ,async (req,res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    const photo = req.file.filename;
    let filePath = path.join(__dirname, 'uploads', photo);
    async function makingGrey(filePath) {
        try {
            let image = await Image.load(filePath);
            let imageGrey = image.grey();
            await imageGrey.save(filePath + '-grey.jpg');
            return imageGrey;
        } catch (e) {
            console.log(e);
            return null;
        }
    }
    async function countWhiteObjects(image) {
        try {
            let threshold = image.mask({ threshold: 0.5 });
            let roiManager = image.getRoiManager(); 
            roiManager.fromMask(threshold);
            let rois = roiManager.getRois();
            console.log(`Знайдено Білих об'єктів: ${rois.length}`);
            return rois.length;
        } catch (error) {
            console.log("помилка при обробці:", error);
            return 0;
        }
    }

    let imageGrey = await makingGrey(filePath);
    if (imageGrey) {
        const whiteObjectsCounter = await countWhiteObjects(imageGrey);
        res.json({
            greyImagePath: photo+'-grey.jpg',
            whiteObjectsCount: whiteObjectsCounter,
        });
    }else {
        res.status(500).json({ error: 'помилка при обробці' });  
    }

})

app.post('/profile-update', upload.single('inputProfile'), async(req,res) => {
    if (!req.file) {
        return res.status(400).send('Файл не был загружен.');
    }
    profilePic = req.file.filename;
    profileDesc = req.body.describsion;
    console.log(profileDesc);
    let fullPathProfile = path.join(__dirname, 'uploads', profilePic);
    
    const userInfo = {
        img:path.join('uploads', profilePic),
        des: profileDesc,
    }
    const userInfoJson = JSON.stringify(userInfo, null, 2);
    fs.writeFile(`users_info/${login}.JSON`, userInfoJson, (err) =>{
        if (err) {
            console.log(err);
            return;
        }
        fs.readFile(`users_info/${login}.JSON`, 'utf-8', (err,data) => {
            if (err) {
             console.error('Ошибка чтения файла:', err);
            }
            const profileData = JSON.parse(data);
            res.render('profile', { 
                login: login,
                description: profileData.des,
                img: profileData.img,
                des: 'exist',
                imgE: 'exist',
                account: 'is',
            });
         })
    })
   
})


const port = 3030;

app.listen(port, () => {
    console.log('the server has just been started');
})