import mongodb from "mongodb"
import mongoose from "mongoose"
const ObjectId = mongodb.ObjectID

let reviews

export default class ReviewsDAO {
  static async injectDB(connect) {
    if (reviews) {
      return
    }
    try {
        reviews = await connect.db("movie-review-site").collection("reviews")
    } catch (e) {
      console.error(`Unable to establish collection handles in userDAO: ${e}`)
    }
  }

  static async addReview(movieId, user, review, rating = 0) {
    try {
      // Validate inputs
      if (!movieId || !user || !review) {
        return { error: "Missing required fields" }
      }
      
      const reviewDoc = {
        movieId: parseInt(movieId),
        user: user,
        review: review,
        rating: parseInt(rating) || 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      console.log("Adding review to database:", reviewDoc)
      return await reviews.insertOne(reviewDoc)
    } catch (e) {
      console.error(`Unable to post review: ${e}`)
      return { error: e.message || "Unable to post review" }
    }
  }

  static async getReview(reviewId) {
    try {
      if (!reviewId) {
        return { error: "Review ID is required" }
      }
      
      return await reviews.findOne({ _id: new mongodb.ObjectId(reviewId) })
    } catch (e) {
      console.error(`Unable to get review: ${e}`)
      return { error: e.message || "Unable to get review" }
    }
  }

  static async updateReview(reviewId, user, review, rating = 0) {
    try {
      if (!reviewId || !user || !review) {
        return { error: "Missing required fields" }
      }
      
      const updateResponse = await reviews.updateOne(
        { _id: new mongodb.ObjectId(reviewId) },
        { 
          $set: { 
            user: user, 
            review: review,
            rating: parseInt(rating) || 0,
            updatedAt: new Date()
          } 
        }
      )

      return updateResponse
    } catch (e) {
      console.error(`Unable to update review: ${e}`)
      return { error: e.message || "Unable to update review" }
    }
  }

  static async deleteReview(reviewId) {
    try {
      if (!reviewId) {
        return { error: "Review ID is required" }
      }
      
      const deleteResponse = await reviews.deleteOne({
        _id: new mongodb.ObjectId(reviewId),
      })

      return deleteResponse
    } catch (e) {
      console.error(`Unable to delete review: ${e}`)
      return { error: e.message || "Unable to delete review" }
    }
  }

  static async getReviewsByMovieId(movieId) {
    try {
      if (!movieId) {
        return { error: "Movie ID is required" }
      }
      
      const cursor = await reviews.find({ movieId : parseInt(movieId) })
        .sort({ createdAt: -1 }) // Sort by newest first
      
      return await cursor.toArray()
    } catch (e) {
      console.error(`Unable to get reviews: ${e}`)
      return { error: e.message || "Unable to get reviews" }
    }
  }

}