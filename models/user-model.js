const mongoose = require("mongoose");


// const CartItemSchema = new mongoose.Schema({
//   product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
//   quantity: { type: Number, default: 1 ,min:0}
// }, { _id: false });



const userSchema = new mongoose.Schema(
    {
        name: {
            required: true,
            type: String,
            trim: true,
        },

        email: {
            required: true,
            type: String,
            trim: true,
            unique: true,
            validate: {
                validator: (value) => {
                    const re =
                        /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
                    return value.match(re);
                },
                message: "Please enter a valid email address",
            },
        },

        password: {
            required: true,
            type: String,
            trim: true,
        },
        addresses: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Address",
                default: []
            }
        ],

        phone: {
            type: String,
            default: null,
            validate: {
                validator: function(value) {
                    // Allow null or valid Indian phone number (+91 followed by 10 digits)
                    if (!value) return true;
                    return /^\+91[6-9]\d{9}$/.test(value);
                },
                message: "Please enter a valid Indian phone number in format +91XXXXXXXXXX"
            },
        },

        phoneVerified: {
            type: Boolean,
            default: false,
        },

        emailVerified: {
            type: Boolean,
            default: false,
        },

        role: {
            type: String,
            default: "user",
        },

        age: {
            type: Number,
            default: null,
            min: 0,
        },

        gender: {
            type: String,
            default: "",
        },

        bio: {
            type: String,
            default: "",
        },

        profileUrl: {
            type: String,
            default: "",
        },

        lastLogin: {
            type: Date,
            default: null,
        },

        wishlist: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'FoodItem'
            }
        ],

        // here we add Cart .
        // cart: {
        //     items:[CartItemSchema],
        //     total:{
        //         type:Number,
        //         default:0
        //     },
        cart: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Cart",
            default: null
        },


        // orders: [
        //     { 
        //     type: mongoose.Schema.Types.ObjectId, // used another collection 
        //     ref: 'Order' 
        //     }
        // ],

        isDeleted: {
            type: Boolean,
            default: false,
            index: true
        }

    },

    { timestamps: true }

);
const User = mongoose.model("User", userSchema);

module.exports = User;