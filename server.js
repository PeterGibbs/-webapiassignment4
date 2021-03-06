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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers','*')
    res=res.status(200)
    
    
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
                        password: crypto.createHmac('sha256', hash_secret).update(req.body.password,"utf8").digest('hex'),
                        name: req.body.name
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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers','*')
    res.json({success: false,msg: 'Invalid method'});
});

app.post('/signin',function(req,res){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers','*')
    console.log(req.body);
    const hash_secret=process.env.HASH_SECRET;
    var pwd=crypto.createHmac('sha256', hash_secret).update(req.body.password,"utf8").digest('hex')
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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers','*')
    res.json({success: false,msg: 'Invalid method'});
})


app.get('/movies',function(req,res){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers','*')
    function sendMovies(movies){
        if(movies){
            let responseData={
                movies
            }
            res.json(movies);
        }
    }
    res=res.status(200)
    if(req.query.reviews==true){
            if(req.query.id){
                Movie.aggregate([
                    
                    { 
                        $addFields: { "id1": { "$toString": "$_id" } }
                    },
                    { 
                        $match: {id1: req.query.id}
                    },
                    {$lookup: { 
                        from: "reviews",
                        localField:"id1",
                        foreignField:"MovieId",
                        as: "movieReviews"
                        }
                    }
                ], function(err,movies){
                    if (err) throw err;
                    for(var i=0; i<movies.length; ++i){
                        var runningTotal=0
                        if(movies[i].movieReviews){
                            for(var j=0; j<movies[i].movieReviews.length; ++j){
                                runningTotal+=movies[i].movieReviews[j].Rating
                            }
                            movies[i].AvgRating=runningTotal/movies[i].movieReviews.length
                        }else{
                            movies[i].AvgRating=0
                        }
                        if(!movies[i].ImageUrl){
                            movies[i].ImageUrl="https://cdn0.iconfinder.com/data/icons/technology-business-and-people/1000/file_light-15-512.png"
                        }
                    }
                    sendMovies(movies[0])

                }

                )
        }else{
            Movie.aggregate([
                
                { 
                    $addFields: { "_id": { "$toString": "$_id" } }
                },
                {
                $lookup: { 
                    from: "reviews",
                    localField:"_id",
                    foreignField:"MovieId",
                    as: "movieReviews"
                    }
                }
                
            ], function(err,movies){
                if (err) throw err;
                for(var i=0; i<movies.length; ++i){
                    var runningTotal=0
                    if(movies[i].movieReviews){
                        for(var j=0; j<movies[i].movieReviews.length; ++j){
                            runningTotal+=movies[i].movieReviews[j].Rating
                        }
                        movies[i].AvgRating=runningTotal/movies[i].movieReviews.length
                    }else{
                        movies[i].AvgRating=0
                    }

                    if(!movies[i].ImageUrl){
                        movies[i].ImageUrl="https://cdn0.iconfinder.com/data/icons/technology-business-and-people/1000/file_light-15-512.png"
                    }
                }
                sendMovies(movies)

            }

            )
        }
        
    }else{
    
        if(req.query.id){
            Movie.find({_id:req.query.id},function(err,movies){
                if (err) throw err;
                
                sendMovies(movies)

            })
        }else{
            Movie.find({},function(err,movies){
                if (err) throw err;
                
                sendMovies(movies)
                


            })
                
            
        }
    }
});
    
app.route('/movies').post(authJwtController.isAuthenticated,function(req,res){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers','*')
    res=res.status(200)
    console.log(req.body);
    if(req.body.title&& req.body.year && req.body.genre && req.body.actors){
       
        
            
        
        Movie.findOne({Title:req.body.title},function(err,movie){
            if(!movie){
                var newMovie=Movie({
                    Title:req.body.title,
                    Year:req.body.year,
                    Genre:req.body.genre,
                    Actors:req.body.actors,
                    ImageUrl:req.body.imageUrl
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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers','*')
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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers','*')
    if(req.body.title){
        
            
        Movie.findOneAndRemove({Title:req.body.title},function(err,movie){
            Review.remove({MovieTitle:req.body.title},function(err,review){
            
                if (err) throw err;
            
            });
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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers','*')
    res.json({success: false,msg: 'Invalid method'});
})

app.get("/reviews",function(req,res){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers','*')
});
app.route("/reviews").post(authJwtController.isAuthenticated,function(req,res){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers','*')
    if(req.body.id&& req.body.comments && req.body.rating){
        Movie.findOne({_id:req.body.id},req.body.movie,function(err,movie){
            
            var user= jwt.verify(req.headers.authorization.split(' ')[1],authJwtController.secret);
            
            if(movie){
                
                    if(user){
                        console.log(User.username)
                        var newReview=Review({
                            MovieId:movie._id,
                            ReviewerName:user.username,
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
            msg: 'Missing values'
            
        } 
        res.json(responseData);

    }
});


app.all('/reviews',function(req,res){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers','*')
    res.json({success: false,msg: 'Invalid method'});
})
http.createServer(app).listen(port,()=>{
    console.log("App is running on port " +port);
});
console.log("starting")