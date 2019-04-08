
var Schema=mongoose.Schema;
var actorSchema=new Schema({
    ActorName:{type:String},
    CharacterName:{type:String}
})
var movieSchema=new Schema({
    Title:{type:String, required: true,unique:true},
    Year:{type: Number, required: true},
    Genre:{type:String,required: true},
    Actors:[actorSchema]

})

var Movie=mongoose.model('Movie',movieSchema)


module.exports=Movie;