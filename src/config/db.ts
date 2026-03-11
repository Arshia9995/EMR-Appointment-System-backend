// import mongoose from "mongoose";

// const connectDB = async () => {
//  try {
//   await mongoose.connect(process.env.MONGO_URI as string);
//   console.log("MongoDB connected");
//  } catch (error) {
//   console.log(error);
//   process.exit(1);
//  }
// };

// export default connectDB;


import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
    try {
        const URI: string = process.env.MONGO_URI!;
        console.log("MONGO_URI:", URI); 
        if(!URI) {
            throw new Error('MONGO_URI not found');
        }

        await mongoose.connect(URI, {
            tls: true, // Ensure TLS is enabled
            serverSelectionTimeoutMS: 5000 // Increase timeout to prevent early failure
          });
        console.log('MongoDB connected successfully');
        
    } catch (error) {
        console.log('Error connecting to MongoDB: ',error);
        
        
    }
};

export default connectDB;