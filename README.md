# Heist

<img width="635" alt="Screenshot 2024-09-11 at 10 04 36 PM" src="https://github.com/user-attachments/assets/c2fe8a04-7549-407e-848b-472da909241b">

Heist is a small scrappy experiment we made to explore some ideas in visual program editing, continuous computation, and constructing and rendering shapes using composable [2D SDF](https://iquilezles.org/articles/distfunctions2d/)s. We made it in a week at a retreat. Keep reading to hear more about the process and ideas that went into the project. [Click here to jump to how to run](#how-to-run).

_<span style="color: gray">This README was written by Elliot at the start of March 2025, 6 months after this project ended.</span>_

## Our Process

[~~Ivan~~](https://ivanish.ca), [Marcel](https://mastodon.social/@wolkenmachine), [Andrew](https://andrewblinn.com/), and [I](https://elliot.website) went to [Gradient Retreat](https://www.gradientretreat.com/) last summer for a week. Ivan Reese put together our cohort, but unfortunately he got sick and was not able to come. We ended up working on this project (the name is a play on the name of Ivan's project, [Hest](https://ivanish.ca/hest/)).

During our stay we explored forest paths, cliffs, and quiet beaches together; got cooking supplies at the island's tiny grocery and convenience store; prepared food and ate together; had a wonderful visit from PVH, Devine, Avi, and Avi's family; worked on our own; and worked together (on this).

Andrew, Marcel and I talked a bunch about strange ideas of ways to compute and interact with computation. We liked this particular thread of conversation and decided to try to write down some concrete shared ideas in the whiteboard below.

<img width="600" alt="Screenshot 2024-09-10 at 5 53 31 PM" src="https://github.com/user-attachments/assets/67d4b1ea-4128-4e55-9d55-0f20e90abd55">

Some highlights are:

- computation that takes up space and flows like a liquid or a goo,
- continuous relational programming,
- probabalistic evaluation of a program as particles following a random path through space,
- program spec and evaluation lives in the same space.

We used this collection of ideas to narrow in on something we were interested in making together: a node and wire visual programming language with some significant twists.

<img width="300" alt="Screenshot 2024-09-10 at 5 53 31 PM" src="https://github.com/user-attachments/assets/4bb01b64-7935-4ece-aeea-75f18137f22b">

The main ideas were:

1. The programming language is for making shapes (constructed using composable [2D SDF](https://iquilezles.org/articles/distfunctions2d/)s, rendered using WebGL). _<span style="color: gray">–Andrew wanted to play around with SDFs.</span>_
2. The shapes are particles that travel along wires. Shape transformations happen continuously as the shape travels along a corresponding transformation wire. _<span style="color: gray">–Elliot wanted to play around with computation on wires instead of in nodes.</span>_
3. the parameters of the transformations (scale,rotate etc.) were controlled by the spatial layout of wires. The visual depiction of wires reflects the transformation they represent. _<span style="color: gray">–Marcel wanted to play around with visual analogies for computation.</span>_

Here's a page where Andrew was figuring out how to compose and transform SDFs.
<img width="340" alt="[Screenshot 2024-09-10 at 5 53 31 PM" src="https://github.com/user-attachments/assets/e5d5b48b-d345-487e-8266-5f09f6969bfe">

Finally, here's a video showing a small node and wire program with debug text of the shape's SDF program through the program run.

I feel satisfied with how we were all able to fit our exploration interests into a single project. I was in the "middle" of the implementation, in the sense that I worked on the continuous computation model and gluing the UI to the SDF evaluator. I was really happy that we were able to divide up the work along the lines of interest, communicate effectively about what we were making and what we needed from eachother, and then glue it all together in the end.

## Further Notes

### [Link to Andrew's note](https://github.com/vezwork/heist/issues/1)

### Marcel's note

What I remember from heist is there was the idea of making a visual language, where the visuality/spatiality was a core part of the semantics.

We made it so the parameters of the transformations (scale,rotate etc.) were basically controlled by the spatial layout. For example:

- The arc represents a rotation, so the shape of the arc represents how much rotation happens.
- The length of the scale operation determines the amount of scaling.
- We then animate the transformations, so as the shape moves along the "rail", we're interpolating smoothly between the transformations
- We spent a lot of time thinking about how boolean operations would work in this frame
  - Eventually, we settled on a discontinous "stamping" effect, where the shapes would wait on each other, and then "stamp" the result of the boolean operation onto a new shape.
- There was some discussion about having a more "functional" approach, v.s. the more "imperative" thing we ended up with. We chose the latter because it allowed for looping shapes around the canvas, which was a cool effect.
- We also had some discussion about where the results should "go". i.e. do we feed the results into a "sink" that then could become a new primitive?

## How to run:

Clone this repo, navigate to the cloned folder in your terminal, and run `npx vite`.
