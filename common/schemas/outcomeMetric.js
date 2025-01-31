import Joi from 'joi';

const schemas = Joi.object({
  outcome: Joi.string().required().messages({
    'string.base': 'Outcome is required',
    'string.empty': 'Outcome is required'
  }),
  metrics: Joi.array().items(
    Joi.object({
      key: Joi.any(),
      metric: Joi.string().messages({
        'string.empty': 'Metric is required',
        'string.null': 'Metric is required'
      })
    })
  )
});

export default schemas;
