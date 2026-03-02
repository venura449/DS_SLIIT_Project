const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname,'/uploads');

if(!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,uploadDir);
    },
    filename:(req,file,cb)=>{
        const uniqueSuffix = `${req.user.authId}-${Date.now()}`;
        cb(null,`${uniqueSuffix}-${file.originalname}`);
    }
});

const fileFiler = (req,res,cb)=>{
    const allowedTypes = '/jpeg|jpg|png|pdf/';
    const extname = allowedTypes.test(path.extname(file.originalname).toLocaleLowerCase());
    if(extname){
        return cb(null,true);
    }
    cb(new Error('Only jpeg, jpg, png, pdf files are allowed'));
};

const upload = multer({
    storage:storage,
    fileFilter:fileFiler,
    limits:{fileSize:10*1024*1024}
});

module.exports = upload;