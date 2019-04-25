var Schema=mongoose.Schema;
var reviewSchema=new Schema({
    ReviewerName:{type:String},
    MovieId:{type:String},
    MovieComments:{type:String},
    Rating:{type:Number}
})
var Review=mongoose.model('Review',reviewSchema)


module.exports=Review;