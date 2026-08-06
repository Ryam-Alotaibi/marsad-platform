-- AlterTable
ALTER TABLE "fl_models" ADD CONSTRAINT "fl_models_name_version_key" UNIQUE ("name", "version");
