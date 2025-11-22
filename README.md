## Inspiration

Today finding products is easier than ever - but finding them locally is not. 
And for small businesses, attracting new customers has only become harder
Cities are changing. Local businesses are disappearing. And people don’t even realize that what they’re buying online could have been picked up right around the corner - faster, more sustainable, and better for their neighborhood.

We want to make local availability visible, effortless, and naturally integrated into the way people already search.
Not a new app. Not a marketplace.
Just a simple layer on top of everyday browsing that reminds you.
That one moment of awareness can turn an online order into a real-world interaction.
It supports shop owners and keeps city centers alive.
It reduces unnecessary shipping and package waste.
And it gives people the feeling of belonging to their neighborhood again exploring it in a different way.
This is not about replacing online shopping.
It’s about creating balance and awareness.

We believe that a healthier city starts with providing a platform to discover what’s already here.

## What it does

## How we built it
The code is kept as simple and lightweight as possible.

**Backend**: Python's FastAPI with Redis Cache, Gemini for semantic parsing

**Frontend**: Chrome Extension with JavaScript

**Data**: Self-gathered database using Google Maps' new Places API

## Challenges we ran into
1. Google Search Engine Results Page (SERP) is not very user friendly. Its HTML and CSS is very obscure and designed to not be tempered with - and we wanted to tamper with it. :-)
2. In order to asses whether our idea is realistic, we needed real world data. We sent a team member into the field to gather this intel, but he had two problems: I. Many stores only open at 10 on Saturday and II. some store owners were too busy or not keen to be interviewed. We must note however, that quite a new were excited to talk about our project and their experiences, and our conclusion from this investigation was that our idea is feasible and useful!
3. Managing the data fetching with API restrictions and long loading times. Due to capacity constraint in the Rechnerhalle, the internet was very slow. We had to find some creative workarounds.

## Accomplishments that we're proud of
1. Our product is very lean. Instead of building the hundredth app which clutters a user's phone and ends up not being used, we built a product which adds value to the users everyday life without requiring a conscious effort like opening an app or a website.
2. We braved many pessimistic predictions about the idea. We managed to get high quality Place data from Google's API, adapt the SERP page to our will, make an intuitive and easy design, and we even got feedback from store owners that our idea has potential.

## What we learned
1. None of us ever built a chrome extension, which ended up being loads of fun, way more fun than the nth phone or web app. 

## What's next for Vom Platzl
- Currently the store owners have no way to be involved in this extension. We could e.g. provide an interface for them to take ownership over their store and leave e.g. messages to customers. This a unique aspect of local stores, especially older ones. There are many stories to tell and they provide countless services as a result of their years of expertise, which often can't be advertised online due to lack of knowhow and resources. 
- Acknowledging that local stores don't only have benefits compared to online retailers, e.g. they tend to be more expensive, they have less flexible opening times, etc., we could integrate further incentives to visit local stores like coupons or loyalty benefits.
- Currently we have a pretty basic mapping from search query to stores. By 1. directly accessing the inventories of stores or 2. further refining our query to the Google Maps API (using a custom machine learning model for semantic parsing) we could improve the results of our plugin, such that the user has a guarantee that the product they are looking for is actually available at the local stores. By talking with store owners, we learned that stores are willing **and** able to provide this data.
- Improved map and map design.

