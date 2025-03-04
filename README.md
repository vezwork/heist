# Heist

<img width="535" alt="Screenshot 2024-09-11 at 10 04 36 PM" src="https://github.com/user-attachments/assets/c2fe8a04-7549-407e-848b-472da909241b">

Heist is a small scrappy experiment we made to explore some ideas in visual program editing, continuous computation, and constructing and rendering shapes using composable [2D SDF](https://iquilezles.org/articles/distfunctions2d/)s. We made it in a week at a retreat. Keep reading to hear more about the process and ideas that went into the project. [Click here to jump to how to clone and run locally](#how-to-run).

_<span style="color: gray">This README was written by Elliot at the start of March 2025, 6 months after this project ended.</span>_

https://github.com/user-attachments/assets/84cc5f5b-87ea-49d7-8169-1b075ac8c430

## Our Process

[~~Ivan~~](https://ivanish.ca), [Marcel](https://mastodon.social/@wolkenmachine), [Andrew](https://andrewblinn.com/), and [I](https://elliot.website) went to [Gradient Retreat](https://www.gradientretreat.com/) last summer for a week. Ivan Reese put together our cohort, but unfortunately he got sick and was not able to come. We ended up working on this project (the name is a play on the name of Ivan's node and wire programming project, [Hest](https://ivanish.ca/hest/)).

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
3. the parameters of the transformations (scale,rotate etc.) were controlled by the spatial layout of wires. The visual depiction of wires reflects the transformation they represent. _<span style="color: gray">–Marcel wanted to play around with semantic visuals.</span>_

Here's a page where Andrew was figuring out how to compose and transform SDFs.

<img width="340" alt="[Screenshot 2024-09-10 at 5 53 31 PM" src="https://github.com/user-attachments/assets/e5d5b48b-d345-487e-8266-5f09f6969bfe">

Finally, here's a video showing a shape particle moving along a rotation and scale wire with debug text of the shape's SDF program changing as its particle travels.

https://github.com/user-attachments/assets/7e0d9f2d-575e-4cfd-b52e-70d6bb9b67cc

## Further Notes

### [Link to Andrew's note](https://github.com/vezwork/heist/issues/1)

### Marcel's note

What I remember from heist is there was the idea of making a visual language, where the visuality/spatiality was a core part of the semantics.

We made it so the parameters of the transformations (scale,rotate etc.) were basically controlled by the spatial layout. For example:

- The arc represents a rotation, so the shape of the arc represents how much rotation happens.

https://github.com/user-attachments/assets/c3dbd9b7-339b-4ba8-ab60-1febe7140b4c

- The length of the scale operation determines the amount of scaling.

  ![image](https://github.com/user-attachments/assets/bce18b71-e11e-4dc3-8bfd-91c52a2b4b5a)

- We then animate the transformations, so as the shape moves along the "rail", we're interpolating smoothly between the transformations
- We spent a lot of time thinking about how boolean operations would work in this frame
  - Eventually, we settled on a discontinous "stamping" effect, where the shapes would wait on each other, and then "stamp" the result of the boolean operation onto a new shape.

https://github.com/user-attachments/assets/bf5e9cda-46b4-45f2-aca4-d825431873f1

- There was some discussion about having a more "functional" approach, v.s. the more "imperative" thing we ended up with. We chose the latter because it allowed for looping shapes around the canvas, which was a cool effect.
- We also had some discussion about where the results should "go". i.e. do we feed the results into a "sink" that then could become a new primitive?

### Elliot's note

Responses to questions from Ivan:

#### what did you all learn from making it?

I learned about creating and executing a small visual programming implementation plan! I was in the "middle" of the implementation, in the sense that I worked on the continuous computation model and gluing Marcel's UI to Andrew's SDF evaluator/renderer. I was really happy that we were able to divide up the work along the lines of interest, communicate effectively about what we were making and what we needed from eachother, and then glue it all together in the end.

#### Have you used these ideas anywhere since?

Exploring the main ideas I discussed above has given me a more concrete sense of one weird frontier of visual programming, but beyond that I couldn't point to anything that it has informed for me.

I was inspired by Marcel's UI work. Right after this I went and made a graph editing UI that I used for graph algorithm debugging and recursion explorations.

#### Is this actually programming?

We made a toy. Its not useful. You can create funky shapes with it. It creates program ASTs. Is it?

#### What's an SDF?

An SDF is a Signed Distance Function. For the purposes of this project, an SDF is a GLSL function that takes a 2D point as input, and returns the distance from that point to a particular shape. You can see these SDF functions in atoms.js. We run these functions in a [shader](https://thebookofshaders.com/01/), which calls the SDF for every pixel; If the SDF returns zero or a negative number, we color the pixel to fill in the shape.

#### How does Heist work?

The UI uses the [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API). Marcel made the UI from scratch in JS (in index.js and notation.js). I programmed particles, how they spatially travel along the UI, and how they construct SDF programs as they travel (in notation.js). Andrew designed the SDF program specification, the program compiler (which takes programs I construct and turns them into GLSL code, in compiler.js and atoms.js), and the renderer (in render.js).

shader.js is a function I forked from Mike Bostock a while ago to allow you to have a shadertoy-like way of writing shaders in JS. vec.js is a small vector math library I made a while ago.

#### Are the ideas weird-for-the-sake-of-weird, or is there a purpose behind your deviations from the norm?

I think they are a bit weird for the sake of weird. It can be fun to think about esoteric stuff with other people. I think they are also weird for the sake of finding common ground and combining our interests into a single project. We took this as an opportunity to try things that we might not usually try.

## How to run:

Clone this repo, navigate to the cloned folder in your terminal, and run `npx vite`. Open your browser and navigate to `localhost:5173`. Use mouse to drag and place wires. Use key controls (listed in bottom left) to change wire type to place next. Use space to create a new particle. Use `?` to show debug info for 0th particle. If you get stuck, just restart the page. The lag is normal.
