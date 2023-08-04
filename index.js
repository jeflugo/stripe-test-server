/* eslint-disable no-undef */
import 'dotenv/config'

import Stripe from 'stripe'
import cors from 'cors'
import express from 'express'
import morgan from 'morgan'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const app = express()
const PORT = process.env.PORT | 3000
const CLIENT_URL = process.env.CLIENT_DOMAIN
	? process.env.CLIENT_DOMAIN
	: 'http://localhost:5173'

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use(
	cors({
		origin: CLIENT_URL,
	})
)

app.use(morgan('tiny'))

app.get('/', (req, res) => res.json({ msg: 'hi' }))

app.post('/create-checkout-session', async (req, res) => {
	try {
		const cartItems = req.body

		const params = {
			submit_type: 'pay',
			mode: 'payment',
			payment_method_types: ['card'],
			billing_address_collection: 'auto',
			shipping_options: [
				{ shipping_rate: 'shr_1NaiZECgYKsyfwLUH0ZfNjGD' },
				{ shipping_rate: 'shr_1Naia3CgYKsyfwLUReSFqvwJ' },
			],

			line_items: cartItems.map(item => {
				const img = item.image[0].asset._ref
				const newImage = img
					.replace('image-', 'http://cdn.sanity.io/images/bchm8lt5/production/')
					.replace('-webp', '.webp')

				return {
					price_data: {
						currency: 'usd',
						product_data: {
							name: item.name,
							images: [newImage],
						},
						unit_amount: item.price * 100,
					},
					adjustable_quantity: {
						enabled: true,
						minimum: 1,
					},
					quantity: item.quantity,
				}
			}),

			success_url: `${CLIENT_URL}/success`,
			cancel_url: `${CLIENT_URL}`,
		}

		const session = await stripe.checkout.sessions.create(params)

		res.json(session)
	} catch (err) {
		console.log(err)
	}
})

app.listen(PORT, () => console.log(`Running on port ${PORT}`))
