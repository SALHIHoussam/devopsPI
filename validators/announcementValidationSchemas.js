import Joi from 'joi';

export const validateAnnouncement = (data) => {
  const schema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    category: Joi.string().valid('food', 'event', 'donation', 'workshop', 'community-drive').required(),
    price: Joi.number().min(0).required(),
    isFree: Joi.boolean().required(),
    location: Joi.string().required(),
    coordinates: Joi.object({
      type: Joi.string().valid('Point').required(),
      coordinates: Joi.array().items(Joi.number()).length(2).required()
    }).required(),
    pickupTime: Joi.object({
      start: Joi.date().required(),
      end: Joi.date().required()
    }).required(),
    userType: Joi.string().valid('individual', 'business').required(),
    tags: Joi.array().items(Joi.string()).required(),
    images: Joi.array().items(Joi.string().uri()).required(),
    foodType: Joi.string().when('category', { is: 'food', then: Joi.required() }),
    quantity: Joi.number().when('category', { is: 'food', then: Joi.required() }),
    unit: Joi.string().when('category', { is: 'food', then: Joi.required() }),
    expiryDate: Joi.date().when('category', { is: 'food', then: Joi.required() })
  });

  return schema.validate(data);
};