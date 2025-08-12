import { Box, Text, Image, HStack } from "@chakra-ui/react";
import kclancyPhoto from "./assets/kclancy_photo.webp";

export function AboutMe() {
  return (
    <Box p={4}>
      <Text fontSize="2xl" fontWeight="bold" mb={4}>
        How I Broke My Jaw
      </Text>
      <Text fontSize="md" color="gray.700" lineHeight="1.3" mb={4}>
        I had just returned home to coastal Washington state after a month in Bali. Suffering from jetlag,
        I spent the first day back being lazy and browsing the internet. Near the end of the day, I decided to go
        for a run. Since my neighbor's dog had charged at me multiple times, I drove downtown to start my run;
        it's a more scenic area anyway.
      </Text>
      <Text fontSize="md" color="gray.700" lineHeight="1.3" mb={4}>
        As I started running, I noticed my legs felt wobbly, like jelly. This made sense, because I hadn't
        run the previous month and had spent the previous day stuck in an airplane seat. "Not an issue," I thought,
        "I'll just have a slow, relaxed run to stay safe."
      </Text>
      <Text fontSize="md" color="gray.700" lineHeight="1.3" mb={4}>
        A minute into my run, I noticed a seagull "drop a bomb" right in front of me. I remembered that a month ago,
        before leaving for Bali, I had been harassed by a seagull in the same area. I had decided to avoid this area,
        but in the intervening month I had temporarily forgotten the whole episode. I suddenly developed an overwhelming fear that I would be
        bombed by territorial seagulls.
      </Text>
      <Text fontSize="md" color="gray.700" lineHeight="1.3" mb={4}>
        I sped up my running pace to exit seagull territory as quickly as possible. I ran faster and faster and faster, until I realized I was
        running too fast, and my legs were exhausted. I reached an elbow in the street I was running on, looked both ways, and crossed.
        As I was turning the corner, I looked up and saw a seagull heading toward me, and I accelerated in fear. As I felt my momentum shifting
        too far forward, I tried to slow down by sliding, but I was running on freshly paved cement with near perfect traction. This threw off my balance
        even more. As I started falling over, I decided not to twist onto my side or back and instead catch myself with my hands to prevent getting scraped.
        This was a big mistake, as only one of my hands landed properly. It broke my wrist. Then my chin hit the sidewalk, breaking the right condyle head of my jaw.
      </Text>
      <Text fontSize="md" color="gray.700" lineHeight="1.3" mb={4}>
        There's a final detail to my story that I think is extremely important. The first time I was harassed by a seagull,
        before I left for Bali, I almost tripped in the exact same place. It freaked me out so much that I considered setting up
        some reminder for myself, perhaps a google calendar event with the text "Don't Run From Seagulls". After a couple of minutes,
        I had talked myself out of setting up any such reminders, feeling silly and overly paranoid. I had been running for
        over 20 years and had never tripped once; I believed that if I did trip, I would get a bit cut up, recover after a few weeks,
        and learn to be more careful. Well, that's not what happened; I broke bones and suffered permanent damage.
      </Text>
      <Text fontSize="md" color="gray.700" lineHeight="1.3">
        A year later, my wrist doesn't bother me too much, despite having been fixed with several titanium screws. It has
        lost a small amount of mobility in bending forward and backward, and it makes a quiet clicking sound when I bend it forward,
        but it's feels just as good as my pristine wrist in resting position. My jaw injury, on the other hand, was much more significant
        psychologically. For one thing, it altered my appearance, making my face slightly asymmetric. More importantly,
        my jaw has a constant "off balance" and mildly fatigued sensation that changes how I experience everything. It's only
        been a year, so I think it's still healing. I want to discuss this experience with others who have broken their jaws.
        That's why I created this site.
      </Text>

      <Text fontSize="2xl" fontWeight="bold" mb={4} mt={8}>
        About Me
      </Text>
      <HStack align="start" gap={6} mb={4}>
        <Image
          src={kclancyPhoto}
          alt="Kevin Clancy"
          boxSize="200px"
          objectFit="cover"
          borderRadius="md"
          flexShrink={0}
        />
        <Box>
          <Text fontSize="md" color="gray.700" lineHeight="1.3" mb={4}>
            I'm a software engineer interested in web development, compilers, and program analysis. I previously worked at CertiK, where
            I developed an abstract interpretation tool for blockchain engineers. I'm currently looking for work, so if you think
            I have the software engineering skills you need, please <a href="https://www.linkedin.com/in/kevin-clancy-740b13189/" style={{ color: "#2563eb", textDecoration: "underline" }}>hire me!</a>
          </Text>
          <Text fontSize="md" color="gray.700" lineHeight="1.3">
            I currently live in the beautiful and seagull-infested Port Angeles, WA. When I'm not coding, I enjoy going to running clubs and learning about math, PL theory, and machine learning.
          </Text>
        </Box>
      </HStack>
    </Box>
  );
}