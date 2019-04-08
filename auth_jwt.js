var passport=require('passport');
var JwtStrategy=require("passport-jwt").Strategy;
var ExtractJwt=require('passport-jwt').ExtractJwt;
mongoose=require('mongoose');

mongoose.connect("mongodb+srv://root:bogas@cluster0-qbpkm.mongodb.net/test?retryWrites=true");
var User=require("./models/user")
var opts={};
opts.jwtFromRequest=ExtractJwt.fromAuthHeaderWithScheme("jwt");
opts.secretOrKey=process.env.JWT_SECRET;
passport.use(new JwtStrategy(opts,function(jwt_payload,done){
    console.log(jwt_payload.id)
    
    User.findOne({jwt_id:jwt_payload.id},function(err,user){
        if(err) throw err;
        if(!user){
            done(null,false);
        }else{
            done(null,user);
        }
    });
    
}))
exports.isAuthenticated=passport.authenticate('jwt',{session:false});
exports.secret=opts.secretOrKey;