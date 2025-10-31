import ReviewsDAO from "./reviews.DAO.js"

export default class ReviewsController {
  // ===== POST NEW REVIEW =====
  static async apiPostReview(req, res, next) {
    try {
      // Input validation
      const { movieId, review, user, rating } = req.body;
      
      // Validate required fields
      if (!movieId) {
        return res.status(400).json({ error: "Movie ID is required" });
      }
      
      if (!user || typeof user !== 'string') {
        return res.status(400).json({ error: "User name is required and must be a string" });
      }
      
      if (!review || typeof review !== 'string') {
        return res.status(400).json({ error: "Review text is required and must be a string" });
      }
      
      // Sanitize and validate user name (2-50 characters)
      const sanitizedUser = user.trim();
      if (sanitizedUser.length < 2 || sanitizedUser.length > 50) {
        return res.status(400).json({ 
          error: "User name must be between 2 and 50 characters" 
        });
      }
      
      // Sanitize and validate review text (10-500 characters)
      const sanitizedReview = review.trim();
      if (sanitizedReview.length < 10 || sanitizedReview.length > 500) {
        return res.status(400).json({ 
          error: "Review must be between 10 and 500 characters" 
        });
      }
      
      // Validate rating (1-5)
      const validatedRating = rating ? parseInt(rating) : 0;
      if (validatedRating < 1 || validatedRating > 5) {
        return res.status(400).json({ 
          error: "Rating must be between 1 and 5" 
        });
      }
      
      // Validate movieId is a number
      const movieIdNum = parseInt(movieId);
      if (isNaN(movieIdNum)) {
        return res.status(400).json({ error: "Movie ID must be a valid number" });
      }
      
      console.log('Creating review:', { movieIdNum, sanitizedUser, sanitizedReview, validatedRating });
      
      // Add review to database
      const reviewResponse = await ReviewsDAO.addReview(
        movieIdNum,
        sanitizedUser,
        sanitizedReview,
        validatedRating
      );
      
      // Check for database errors
      if (reviewResponse.error) {
        return res.status(500).json({ error: reviewResponse.error });
      }
      
      res.status(201).json({ 
        status: "success",
        message: "Review created successfully",
        reviewId: reviewResponse.insertedId
      });
      
    } catch (e) {
      console.error('Error in apiPostReview:', e);
      res.status(500).json({ error: e.message || "Internal server error" });
    }
  }

  // ===== GET SINGLE REVIEW =====
  static async apiGetReview(req, res, next) {
    try {
      const id = req.params.id;
      
      if (!id) {
        return res.status(400).json({ error: "Review ID is required" });
      }
      
      let review = await ReviewsDAO.getReview(id);
      
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      
      res.json(review);
      
    } catch (e) {
      console.error(`Error in apiGetReview: ${e}`);
      res.status(500).json({ error: "Failed to fetch review" });
    }
  }

  // ===== UPDATE REVIEW =====
  static async apiUpdateReview(req, res, next) {
    try {
      const reviewId = req.params.id;
      const { review, user, rating } = req.body;
      
      // Validate review ID
      if (!reviewId) {
        return res.status(400).json({ error: "Review ID is required" });
      }
      
      // Validate required fields
      if (!user || typeof user !== 'string') {
        return res.status(400).json({ error: "User name is required and must be a string" });
      }
      
      if (!review || typeof review !== 'string') {
        return res.status(400).json({ error: "Review text is required and must be a string" });
      }
      
      // Sanitize and validate user name
      const sanitizedUser = user.trim();
      if (sanitizedUser.length < 2 || sanitizedUser.length > 50) {
        return res.status(400).json({ 
          error: "User name must be between 2 and 50 characters" 
        });
      }
      
      // Sanitize and validate review text
      const sanitizedReview = review.trim();
      if (sanitizedReview.length < 10 || sanitizedReview.length > 500) {
        return res.status(400).json({ 
          error: "Review must be between 10 and 500 characters" 
        });
      }
      
      // Validate rating
      const validatedRating = rating ? parseInt(rating) : 0;
      if (validatedRating < 1 || validatedRating > 5) {
        return res.status(400).json({ 
          error: "Rating must be between 1 and 5" 
        });
      }
      
      console.log('Updating review:', { reviewId, sanitizedUser, sanitizedReview, validatedRating });
      
      // Update review in database
      const reviewResponse = await ReviewsDAO.updateReview(
        reviewId,
        sanitizedUser,
        sanitizedReview,
        validatedRating
      );

      if (reviewResponse.error) {
        return res.status(400).json({ error: reviewResponse.error });
      }

      if (reviewResponse.modifiedCount === 0) {
        return res.status(404).json({
          error: "Review not found or no changes made"
        });
      }

      res.json({ 
        status: "success",
        message: "Review updated successfully"
      });
      
    } catch (e) {
      console.error('Error in apiUpdateReview:', e);
      res.status(500).json({ error: e.message || "Failed to update review" });
    }
  }

  // ===== DELETE REVIEW =====
  static async apiDeleteReview(req, res, next) {
    try {
      const reviewId = req.params.id;
      
      if (!reviewId) {
        return res.status(400).json({ error: "Review ID is required" });
      }
      
      console.log('Deleting review:', reviewId);
      
      const reviewResponse = await ReviewsDAO.deleteReview(reviewId);
      
      if (reviewResponse.error) {
        return res.status(500).json({ error: reviewResponse.error });
      }
      
      if (reviewResponse.deletedCount === 0) {
        return res.status(404).json({ error: "Review not found" });
      }
      
      res.json({ 
        status: "success",
        message: "Review deleted successfully"
      });
      
    } catch (e) {
      console.error('Error in apiDeleteReview:', e);
      res.status(500).json({ error: e.message || "Failed to delete review" });
    }
  }

  // ===== GET ALL REVIEWS FOR A MOVIE =====
  static async apiGetReviews(req, res, next) {
    try {
      const id = req.params.id;
      
      if (!id) {
        return res.status(400).json({ error: "Movie ID is required" });
      }
      
      // Validate movie ID is a number
      const movieIdNum = parseInt(id);
      if (isNaN(movieIdNum)) {
        return res.status(400).json({ error: "Movie ID must be a valid number" });
      }
      
      console.log('Fetching reviews for movie:', movieIdNum);
      
      let reviews = await ReviewsDAO.getReviewsByMovieId(movieIdNum);
      
      if (!reviews) {
        return res.status(404).json({ error: "No reviews found" });
      }
      
      // Return empty array instead of error if no reviews
      if (reviews.error) {
        return res.status(500).json({ error: reviews.error });
      }
      
      res.json(reviews);
      
    } catch (e) {
      console.error(`Error in apiGetReviews: ${e}`);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  }
}