require('dotenv').config()
var express=require('express')
var http=require('http')
var bodyParser=require('body-parser')
var passport=require('passport')
const crypto = require('crypto');
var port = process.env.PORT || 8080;

var authJwtController=require('./auth_jwt');
//var authController=require('./auth');
mongoose=require('mongoose');

mongoose.connect("mongodb+srv://root:bogas@cluster0-xecav.mongodb.net/test?retryWrites=true",(err,db)=>{
    if (err) throw err;
    console.log("connect to db")
});
var User=require("./models/user");
var Movie=require("./models/movie");
var Review=require("./models/review");
var jwt=require('jsonwebtoken');
var app=express();



app.use(passport.initialize());
app.use(bodyParser.json({
    type: function(req){
        return 'application/json';
    }
}));


app.post('/signup',function(req,res){
    
    res=res.status(200)
    
    console.log(req.body);
    let alreadyExists=false;
    if(req.body.username&& req.body.password){
        
        
        User.findOne({username:req.body.username},function(err,user){
            if(err) throw err;
            console.log(user);
            if(user){
                alreadyExists=true;
                let responseData={
                    success: false,
                    msg: 'User already exists'
                }
                res.json(responseData);
                
            }else{
                console.log("adding")
                const hash_secret=process.env.HASH_SECRET;
                var newUser=User({
                    username: req.body.username,
                        password: crypto.createHmac('sha256', hash_secret).update(req.body.password).digest('hex')
                    });
                    newUser.save(function(err){
                        if(err) throw err;
                        let responseData={
                            success: true,
                                msg: 'Successful created new user.'
                            }
                        console.log("added new user")

                        res.json(responseData);
                    });
                }
                
        });

       
           
    }else{
        let responseData={
            success: false,
            msg: 'Missing username or password'
        }
        res.json(responseData);
    }
    
    

});
app.all('/signup',function(req,res){
    res.json({success: false,msg: 'Invalid method'});
});

app.post('/signin',function(req,res){
    console.log(req.body);
    const hash_secret=process.env.HASH_SECRET;
    var pwd=crypto.createHmac('sha256', hash_secret).update(req.body.password).digest('hex')
    User.findOne({username:req.body.username,password:pwd},function(err,user){
        if(err) throw err;
        if(!user){
            res.status(401).send({success:false,msg:"User or password invalid"})
        }else{
            var userToken={id:user.jwt_id,username:user.username}
            var token=jwt.sign(userToken,authJwtController.secret);
            res.json({success: true,token:'JWT '+token});
        }
    })
    
    
});

app.all('/signin',function(req,res){
    res.json({success: false,msg: 'Invalid method'});
})

app.get('/movies',function(req,res){
    function sendMovies(movies){
        if(movies){
            let responseData={
                success: true,
                movies: movies
            }
            res.json(responseData);
        }
    }
    res=res.status(200)
    
    
    if(req.body.title){
        Movie.find({Title:req.body.title},function(err,movies){
            if (err) throw err;
            if(movies){
                if(req.body.reviews=="true"){
                    for(var i=0; i<movies.length; ++i){
                        movies[i].Reviews=[];
                        Review.find({MovieTitle:req.body.title},function(err,reviews){
                            if (err) throw err;
                            console.log(movies[i].Title)
                            movies[i].Reviews=reviews
                        })
                    }
                    
                       
                    
                }
            }
            sendMovies(movies)

        })
    }else{
        Movie.find({},function(err,movies){
            if (err) throw err;
            if(req.body.reviews=="true"){
                movies.forEach(movie => {
                    Review.find({MovieTitle:req.body.title},function(err,reviews){
                        if (err) throw err;
                        movie.reviews=reviews
                    })
                });

            }
            sendMovies(movies)
            


        })
            
        
    }
});
    
app.route('/movies').post(authJwtController.isAuthenticated,function(req,res){

    res=res.status(200)
    console.log(req.body);
    if(req.body.title&& req.body.year && req.body.genre && req.body.actors){
       
        
            
        
        Movie.findOne({Title:req.body.title},function(err,movie){
            if(!movie){
                var newMovie=Movie({
                    Title:req.body.title,
                    Year:req.body.year,
                    Genre:req.body.genre,
                    Actors:req.body.actors
                });
            
                newMovie.save(function(err){
                    if(err) throw err;
                });
                console.log("added new movie")
                let responseData={
                    success: true,
                    msg: 'Successful created new movie.'
                }
                res.json(responseData);
            }else{
                let responseData={
                    success: true,
                    msg: 'Movie already exists',
                    movie:movie
                }
                res.json(responseData);
            }
            
            });
        }else{
            let responseData={
                success: false,
                msg: 'Missing some input information'
                
            } 
            res.json(responseData);
        }
    
});
app.route('/movies').put(authJwtController.isAuthenticated,function(req,res){
    if(req.body.title&& req.body.movie){
       Movie.findOneAndUpdate({Title:req.body.title},req.body.movie,function(err,movie){
            if(movie){
                
                if (err) throw err;
                let responseData={
                    success: true,
                    msg: 'Movie updated',
                    
                }
                res.json(responseData);
            }else{
                let responseData={
                    success: false,
                    msg: 'Movie not found'
                    
                } 
                res.json(responseData);
            }
        
       });
    }else{
        let responseData={
            success: false,
            msg: 'Missing some input information'
            
        } 
        res.json(responseData);
    }
});
app.route('/movies').delete(authJwtController.isAuthenticated,function(req,res){
    if(req.body.title){
        Movie.findOneAndRemove({Title:req.body.title},function(err,movie){
            
            if (err) throw err;
            if(!movie){
                let responseData={
                    success: false,
                    msg: 'Movie not found'
                    
                } 
                res.json(responseData);
            }else{
                let responseData={
                    success: true,
                    msg: 'Movie deleted'
                    
                } 
                res.json(responseData);
            }
        })
    }else{
        let responseData={
            success: false,
            msg: 'Missing title'
            
        } 
        res.json(responseData);
    }
});
app.all('/movies',function(req,res){
    res.json({success: false,msg: 'Invalid method'});
})

app.get("/reviews",function(req,res){

});
app.route("/reviews").post(authJwtController.isAuthenticated,function(req,res){
    Movie.findOneAndUpdate({Title:req.body.title},req.body.movie,function(err,movie){
        
        var id=req.headers.authorization;
        console.log("ID IS "+id)
        if(movie){
            User.findOne({jwt_id:id},function(err,user){
                if(User){
                    var newReview=Review({
                        MovieTitle:req.body.title,
                        ReviewerName:User.username,
                        MovieComments:req.body.comments,
                        Rating:req.body.rating
                    });
                
                    newReview.save(function(err){
                        if(err) throw err;
                    });
                    if (err) throw err;
                    let responseData={
                        success: true,
                        msg: 'Review posted'
                        
                        
                    }
                    res.json(responseData);
                }else{
                    let responseData={
                        success: true,
                        msg: 'Invalid user'
                        
                        
                    }
                    res.json(responseData);
                }
            
            
        });
        }else{
            let responseData={
                success: false,
                msg: 'Movie not found'
                
            } 
            res.json(responseData);
        }
    
   });
});


app.all('/reviews',function(req,res){
    res.json({success: false,msg: 'Invalid method'});
})
http.createServer(app).listen(port,()=>{
    console.log("App is running on port " +port);
});
console.log("starting")