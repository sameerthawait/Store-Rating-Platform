import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RatingResponseDto } from './dto/rating-response.dto';
import { SubmitRatingDto } from './dto/submit-rating.dto';
import { RatingsService } from './ratings.service';

@ApiTags('Ratings / Feedback')
@Controller('ratings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit or update a store star rating (1-5) atomically (Authenticated users)',
  })
  @ApiCreatedResponse({
    description: 'Rating successfully submitted or updated',
    type: RatingResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Rating outside 1-5 range or invalid store UUID',
  })
  @ApiNotFoundResponse({
    description: 'This store is no longer available',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Authentication token is missing or expired',
  })
  async submitRating(
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitRatingDto,
  ): Promise<RatingResponseDto> {
    return this.ratingsService.submitRating(userId, dto);
  }
}
