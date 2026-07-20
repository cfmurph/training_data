package com.traintrack.repository;

import com.traintrack.model.TrainingPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrainingPlanRepository extends JpaRepository<TrainingPlan, Long> {

    List<TrainingPlan> findByAthleteIdOrderByCreatedAtDesc(String athleteId);

    Optional<TrainingPlan> findByAthleteIdAndActiveTrue(String athleteId);

    List<TrainingPlan> findByAthleteIdAndActiveFalseOrderByCreatedAtDesc(String athleteId);
}
