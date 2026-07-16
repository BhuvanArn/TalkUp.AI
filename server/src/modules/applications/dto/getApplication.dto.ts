import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { ApplicationStatus } from "@common/enums/ApplicationStatus";
import { application } from "@entities/application.entity";

@ApiSchema({ name: "OfferDetails" })
export class OfferDetailsDto {
  @ApiProperty({ nullable: true, type: String }) job_title: string | null;
  @ApiProperty({ nullable: true, type: String }) company_name: string | null;
  @ApiProperty({ nullable: true, type: String })
  company_description: string | null;
  @ApiProperty({ nullable: true, type: String }) sector: string | null;
  @ApiProperty({ nullable: true, type: String }) contract_type: string | null;
  @ApiProperty({ nullable: true, type: String }) location: string | null;
  @ApiProperty({ type: [String] }) required_skills: string[];
  @ApiProperty({ type: [String] }) preferred_skills: string[];
  @ApiProperty({ nullable: true, type: String })
  required_experience: string | null;
  @ApiProperty({ nullable: true, type: String })
  required_education: string | null;
  @ApiProperty({ type: [String] }) missions: string[];
  @ApiProperty({ type: [String] }) soft_skills: string[];
  @ApiProperty({ type: [String] }) languages_required: string[];
  @ApiProperty({ nullable: true, type: String }) salary_range: string | null;
  @ApiProperty({ type: [String] }) company_values: string[];
  @ApiProperty({ nullable: true, type: String })
  team_description: string | null;
}

@ApiSchema({ name: "CvExperience" })
export class CvExperienceDto {
  @ApiProperty({ nullable: true, type: String }) company: string | null;
  @ApiProperty({ nullable: true, type: String }) title: string | null;
  @ApiProperty({ nullable: true, type: String }) description: string | null;
  @ApiProperty({ nullable: true, type: String }) duration: string | null;
}

@ApiSchema({ name: "CvEducation" })
export class CvEducationDto {
  @ApiProperty({ nullable: true, type: String }) degree: string | null;
  @ApiProperty({ nullable: true, type: String }) school_name: string | null;
  @ApiProperty({ nullable: true, type: String }) duration: string | null;
}

@ApiSchema({ name: "CvLanguage" })
export class CvLanguageDto {
  @ApiProperty({ nullable: true, type: String }) language: string | null;
  @ApiProperty({ nullable: true, type: String }) level: string | null;
}

@ApiSchema({ name: "CvDetails" })
export class CvDetailsDto {
  @ApiProperty({ nullable: true, type: String }) desired_job: string | null;
  @ApiProperty({ nullable: true, type: String }) resume: string | null;
  @ApiProperty({ type: [CvExperienceDto] }) experiences: CvExperienceDto[];
  @ApiProperty({ type: [CvEducationDto] }) education: CvEducationDto[];
  @ApiProperty({ type: [String] }) technical_skills: string[];
  @ApiProperty({ type: [CvLanguageDto] }) languages: CvLanguageDto[];
}

@ApiSchema({ name: "Application" })
export class GetApplicationDto {
  @ApiProperty() applicationId: string;
  @ApiProperty({ nullable: true, type: String }) companyName: string | null;
  @ApiProperty({ nullable: true, type: String }) jobTitle: string | null;
  @ApiProperty({ enum: ApplicationStatus }) status: ApplicationStatus;
  @ApiProperty({ nullable: true, type: String }) offerUrl: string | null;
  @ApiProperty({ nullable: true, type: OfferDetailsDto })
  offerDetails: OfferDetailsDto | null;
  @ApiProperty({ nullable: true, type: CvDetailsDto })
  cvDetails: CvDetailsDto | null;
  @ApiProperty() appliedAt: Date;
  @ApiProperty({ nullable: true, type: Date }) interviewAt: Date | null;
  @ApiProperty() updatedAt: Date;

  static fromEntity(row: application): GetApplicationDto {
    const dto = new GetApplicationDto();
    dto.applicationId = row.application_id;
    dto.companyName = row.company_name ?? null;
    dto.jobTitle = row.job_title ?? null;
    dto.status = row.status;
    dto.offerUrl = row.offer_url ?? null;
    dto.offerDetails = (row.offer_details as OfferDetailsDto) ?? null;
    dto.cvDetails = (row.cv_details as CvDetailsDto) ?? null;
    dto.appliedAt = row.applied_at;
    dto.interviewAt = row.interview_at ?? null;
    dto.updatedAt = row.updated_at;
    return dto;
  }
}
