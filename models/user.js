
var crypto=require('crypto');
var Schema=mongoose.Schema;

var userSchema=new Schema({
    username:{type:String, required: true, unique: true},
    password:{type: String, required: true},
    jwt_id:{type:String}

})

userSchema.pre('save',function(){

    this.jwt_id=crypto.randomBytes(20).toString("hex");
    next()
});

var User=mongoose.model('User',userSchema)


module.exports=User;