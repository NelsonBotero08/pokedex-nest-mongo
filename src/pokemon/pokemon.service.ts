import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { isValidObjectId, Model } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';
import * as request from 'supertest';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PokemonService {

  private defautlLimit: number;

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
    private readonly configService: ConfigService,
  ) {

    this.defautlLimit = configService.get<number>('defaultLimit')!
  
  }

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();

    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);

      return pokemon;
    } catch (error) {
      this.handledException(error);
    }
  }

  findAll( paginationDto: PaginationDto ) {

    const { limit = this.defautlLimit , offset = 0 } = paginationDto // paginacion
    
    return this.pokemonModel.find()
      .limit(limit)
      .sort({
        no:1
      })// orden de las columnas segun parametro
      .select('-__V');//columna que no se desea ver
  }

  async findOne(term: string) {
    let pokemon: Pokemon | null;

    if (!isNaN(+term)) {
      pokemon = await this.pokemonModel.findOne({ no: +term });

      if (!pokemon) {
        throw new NotFoundException(`Pokemon with no "${term}" not found`);
      }

      return pokemon;
    }

    if (isValidObjectId(term)) {
      pokemon = await this.pokemonModel.findById(term);

      if (!pokemon) {
        throw new NotFoundException(`Pokemon with id "${term}" not found`);
      }

      return pokemon;
    }

    pokemon = await this.pokemonModel.findOne({
      name: term.toLocaleLowerCase(),
    });

    if (!pokemon) {
      throw new NotFoundException(`Pokemon with name "${term}" not found`);
    }

    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.findOne(term);

    try {
      if (updatePokemonDto.name)
        updatePokemonDto.name = updatePokemonDto.name.toLocaleLowerCase();

      await pokemon.updateOne(updatePokemonDto);

      return { ...pokemon.toJSON(), ...updatePokemonDto };
    } catch (error) {
      this.handledException(error);
    }
  }

  async remove(id: string) {
    // const pokemon = await this.findOne(id)
    // await pokemon.deleteOne(Pokemon)

    // de esta manera evitamos hacer dos consultas a la base de datos para buscar el pokemon y luego eliminarlo
    const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id });

    if (deletedCount === 0)
      throw new BadRequestException(`Pokemon with id "${id}" not found`);
  }

  private handledException(error) {
    if (error.code === 11000) {
      throw new BadRequestException(
        `pokemon exists in db ${JSON.stringify(error.keyValue)}`,
      );
    }
    console.log(error);
    throw new InternalServerErrorException(
      `Can't create pokemon - check server logs`,
    );
  }
}
