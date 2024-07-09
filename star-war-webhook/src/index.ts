import { ApolloServer, gql } from 'apollo-server';
import axios from 'axios';

interface Character {
    name: string;
    birthYear: string;
    height: string;
    homeworld: Homeworld;
    films: Film[];
    vehicles: Vehicle[];
    starships: Starship[];
}

interface Homeworld {
    name: string;
    climate: string;
    terrain: string;
}

interface Film {
    title: string;
    episodeID: number;
}

interface Vehicle {
    name: string;
    model: string;
    class: string;
    cost: number | null;
}

interface Starship {
    name: string;
    model: string;
    class: string;
    cost: number | null;
}

const typeDefs = gql`
    type Query {
        character(name: String!): Character
    }

    type Character {
        name: String
        birthYear: String
        height: String
        homeworld: Homeworld
        films: [Film]
        vehicles: [Vehicle]
        starships: [Starship]
    }

    type Homeworld {
        name: String
        climate: String
        terrain: String
    }

    type Film {
        title: String
        episodeID: Int
    }

    type Vehicle {
        name: String
        model: String
        class: String
        cost: Int
    }

    type Starship {
        name: String
        model: String
        class: String
        cost: Int
    }
`;

const resolvers = {
    Query: {
        character: async (_: any, { name }: { name: string }): Promise<Character> => {
            const peopleResponse = await axios.get(`https://swapi.dev/api/people/?search=${name}`);
            const person = peopleResponse.data.results[0];

            if (!person) {
                throw new Error(`Character with name ${name} not found.`);
            }

            const homeworldResponse = await axios.get(person.homeworld);
            const filmsResponses = await Promise.all(person.films.map((url: string) => axios.get(url)));
            const vehiclesResponses = await Promise.all(person.vehicles.map((url: string) => axios.get(url)));
            const starshipsResponses = await Promise.all(person.starships.map((url: string) => axios.get(url)));

            return {
                name: person.name,
                birthYear: person.birth_year,
                height: person.height,
                homeworld: {
                    name: homeworldResponse.data.name,
                    climate: homeworldResponse.data.climate,
                    terrain: homeworldResponse.data.terrain
                },
                films: filmsResponses.map(film => ({
                    title: film.data.title,
                    episodeID: film.data.episode_id
                })),
                vehicles: vehiclesResponses.map(vehicle => ({
                    name: vehicle.data.name,
                    model: vehicle.data.model,
                    class: vehicle.data.vehicle_class,
                    cost: vehicle.data.cost_in_credits !== 'unknown' ? parseInt(vehicle.data.cost_in_credits) : null
                })),
                starships: starshipsResponses.map(starship => ({
                    name: starship.data.name,
                    model: starship.data.model,
                    class: starship.data.starship_class,
                    cost: starship.data.cost_in_credits !== 'unknown' ? parseInt(starship.data.cost_in_credits) : null
                }))
            };
        }
    }
};

// Create Apollo Server
const server = new ApolloServer({
    typeDefs,
    resolvers
});

// Start the server
server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`);
});
