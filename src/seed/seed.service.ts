import { Injectable } from '@nestjs/common';
import { PokeResponse } from './interfaces/poke-response.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { AxiosAdapter } from 'src/common/adapters/axios.adapter';

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
    private readonly axiosAdapter: AxiosAdapter
  ) {}
  

  async executeSeed() {
    await this.pokemonModel.deleteMany({}); // de esta manera se eliminan todos los registros

    const data  = await this.axiosAdapter.get<PokeResponse>(
      'https://pokeapi.co/api/v2/pokemon?limit=650',
    );

    const pokemonToInsert: { name: string; no: number }[] = [];
    data.results.forEach(async (pokemon) => {
      const name = pokemon.name;
      const no = +pokemon.url.split('/')[6];
      pokemonToInsert.push({ name, no });
    });

    await this.pokemonModel.insertMany(pokemonToInsert); // asi ingresa todos los registros de una sola vez

    return 'seed executed';
  }
}
