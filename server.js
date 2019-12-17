const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cookieParser = require('cookie-parser');

//
const port = 3000;
//middleware that shows how app works and what to do on stuffs
const app = express();
app.listen(port);
app.use(express.urlencoded({extended:false}))
app.set('view-engine' , 'ejs');
app.use(express.json({limit:'5mb'}));
app.use(cookieParser());
app.use(express.static("public"));

//
 console.log("\n");
console.warn(` http://127.0.0.1:${port} `);
console.log("Visit above link\n\n\n ");

//mongoose middle ware
mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true});

//article schema and object
const article = mongoose.model('articles' , {
    authorid:{
        type:String,
        required:true
    },
    views:{
        type:Number,
        required:true
    },
    date:{
        type:Date,
        required:true
    },
    author:{
        type:String,
        required:true
    },
    title:{
        type:String,
        required:true
    },
    subtitle:{
        type:String,
        required:true
    },
   data:{    
    type:String,
    required:true
   }
});


//user schema and object
const user = mongoose.model('users' , {
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        index:true,
      // unique:true,
       uniqueCaseInsensitive:true
    },
    password:{
        type:String,
        required:true
    }
   
});
//user.createIndexes({email:String});



//express session middleware
    //some cookie control
app.use(session({
    key: '_id',
    secret: 'somerandonstuffs',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));
    //this checks for user id is still in browser but user is not set then clear that cookie
    //this calls when new device request to server at any port
app.use((req, res, next) => {
  
        if (req.cookies._id && !req.session.user) {
            res.clearCookie('user_sid');    
              
        }
        if(req.cookies._id ){
            req.session.notspec = false; 
        }
        next();
});
    
//after auth user can not go to login and singup page
function authRedirect(req , res , next){
    if (isAuth(req)) {
        res.redirect('/');
    } else {
        next();
    }    
}

//is user and article are same


//check if user can allowed to go to specific url
function canUserGo(req , res , next){
    if (!isAuth(req)) {
        res.redirect('/');
    } else {
        next();
    }  
}

//all inOne function to check auth.
function isAuth(req){ 
    if(req.session.user && req.cookies._id ){   
        return true;
    }
    return false;
}


//message sender 


//------------------------------------------------------
//all get request
//------------------------------------------------------

app.get('/' , async(req , res)=>{ 
    console.log("here on  home route");
   await article.find({}).sort({views:-1}).limit(10).exec((err , data)=>{
        if(err){
         console.log(err);  
        }
        let user = null;
       if( isAuth(req)){
            user = req.session.user;
        }
    res.render('home.ejs' , {data:data , user : user});
    })
   
})

//to singup
app.get('/singup' , authRedirect , (req , res)=>{
    res.render('singup.ejs');
});

//to login
app.get('/login' , authRedirect , (req , res)=>{
  
    res.render('login.ejs'  , {message:req.session.notspec});
});

//to do secret stuffs :)
app.get('/secret' , (req  ,res)=>{
    if(isAuth(req)){
        res.render('secret.ejs');
    }else{
        res.redirect('/login');
    }

});

//get request to add article to page
app.get('/add' , canUserGo ,(req , res)=>{
    console.log('is auth' + isAuth(req));
    let user = null;
    if( isAuth(req)){
         user = req.session.user;
     }
    res.render('addArticle.ejs' , {message:undefined , user:user});
})

//get request to show specific article
app.get('/show/:id' , async(req , res)=>{

try{
    await article.findById(req.params.id , (err , data)=>{
      let views = {views:data.views+1}; 
     article.findByIdAndUpdate(req.params.id , views , (err , data)=>{
        
     } );
     let user = null;
     let suser = false;
    if( isAuth(req)){
         user = req.session.user;
         //console.log(data.authorid  +  "\n" + req.session.user[0]._id);
         if(data.authorid == req.session.user[0]._id){
            suser = true;
        }
        }
     
    

    res.render('show.ejs' , {data : data , user:user ,sameuser:suser })
});}
catch(err){
    console.log(err);
}
});


//get all the article and profile of user
app.get('/user/:id' , async(req , res)=>{
    try{
        let userData;
        let data;
        //check if user existed
        await user.findById(req.params.id , (err , datas)=>{
            if(err){
                console.log(err);
                res.redirect('/');
                return;
            }else{
                userData = datas;
            }});

            //get all artice of user
        await article.find({authorid:req.params.id} , (err , articles)=>{
            if(err){
                console.log(err);
                res.redirect('/');
                return;
            }else{
                data = articles;
               // console.log(articles)
            }});
           // console.log( data);
       await  res.render('profile.ejs' , {data:data , user:userData})
        
    }catch(err){

        console.log("here" + err);
    }
})



//to logout
app.get('/logout' ,canUserGo , (req, res)=>{
    req.session.user = null;
    res.redirect('/');
})


//------------------------------------------------------
//all post request
//------------------------------------------------------

//login post request
app.post('/login' ,async(req, res)=>{

    try{
await user.find({email : (req.body.email).toUpperCase()} , (err , data)=>{

    if(data.length == 0){
        req.session.notspec = true;
        res.redirect('/login');
        return;
    }
    if(data != null){ 
        if(req.body.password === data[0].password){
            req.session.user = data;
            res.redirect('/');
        }else{
            req.session.notspec = true;
            res.redirect( 302,'/login');
        }
    }else{
        req.session.notspec = true;
    res.redirect( 302,'/login');
    }
})
}catch(err){
    console.log(err);
    req.session.notspec = true;
    res.redirect( 302,'/login')
}
});


//singup post request
app.post('/singup' , (req, res)=>{
//console.log(JSON.stringify(req.body .file));
let User = new user({
    name:req.body.name,
    email:(req.body.email).toUpperCase(),
    password:req.body.password,
  
})
User.save();
//res.json(req.body);
res.redirect( 301 ,'/login');

    
})

//add article to database  
app.post('/add' ,canUserGo, (req , res)=>{
    
    let data =new article({
        authorid:req.session.user[0]._id,
        views:0,
        author:req.session.user[0].name,
        date:new Date(),
        title:req.body.title,
        subtitle:req.body.subtitle,
        data:req.body.body
    })
     data.save()
     res.redirect("/");
});

//delete article
app.post('/delete' , canUserGo , async (req , res)=>{
    
    await article.find({_id:req.body.id }, (err , data)=>{
        
      if(data[0].authorid == req.session.user[0]._id){ // checking if deleting user is author is that article
         
          article.findByIdAndDelete(req.body.id , (err ,data)=>{
              console.log("article is deleting.....\nid:" + req.body.id);
          });
      }
  })
    res.redirect('/');
     
})
   
