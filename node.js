const express = require('express');
const hbs = require('hbs');
const path = require('path');
const multer = require('multer');
const { urlencoded } = require('body-parser');
// working with photos
let getColors = require('get-image-colors');
let { Image } = require('image-js')

const app = express();

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
    // if (!req.session.id) {
    //     res.render('index');
    // }
    res.render('index');
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