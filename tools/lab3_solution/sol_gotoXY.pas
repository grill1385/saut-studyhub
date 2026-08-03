procedure gotoXY(xf, yf, tf: double; var RC: TRobotControls);
var rotateToFinal, ang_target, error_dist, error_finalrot, V, Vn, W: double;
begin
  //Calc errors
  ang_target := ATan2(yf-yodo, xf-xodo);
  error_dist := Sqrt(sqr(xf-xodo) + sqr(yf-yodo));
  error_finalrot := NormalizeAngle(tf - thodo);

  //Find fastest rotation
  if error_finalrot > 0 then begin
    rotateToFinal := RotateRight;
  end else begin
    rotateToFinal := RotateLeft;
  end;

  //Transitions Linear Vel
  case state_Lin of
    Go_Forward: begin
      if error_dist < TOL_FINDIST then begin
        state_Lin := Stop_Lin;
      end else if error_dist < DIST_DA then begin
        state_Lin := De_Accel_Lin;
      end;
    end;
    De_Accel_Lin: begin
      if error_dist < TOL_FINDIST then begin
        state_Lin := Stop_Lin;
      end else if error_dist > DIST_NEWPOSE  then begin
        state_Lin := Go_Forward;
      end;
    end;
    Stop_Lin: begin
      if error_dist > DIST_NEWPOSE then begin
        state_Lin := Go_Forward;
      end;
    end;
  end;

  //Outputs
  case state_Lin of
    Go_Forward : begin
      V := VEL_LIN_NOM*cos(ang_target-thOdo);
      Vn := VEL_LIN_NOM *sin(ang_target-thOdo);
      SetRCValue(9,13,'Go_F');
    end;
    De_Accel_Lin : begin
      V := VEL_LIN_NOM*cos(ang_target-thOdo)/3;
      Vn := VEL_LIN_NOM*sin(ang_target-thOdo)/3;
      SetRCValue(9,13,'DAcc');
    end;
    Stop_Lin : begin
      V := 0;
      Vn := 0;
      SetRCValue(9,13,'StopL');
    end;
  end;

  //Transitions Rotation
  case state_Rot of
    Rotation: begin
      if abs(error_finalrot) < TOL_FINTHETA then begin
        state_Rot := Stop_Rot;
      end else if abs(error_finalrot) < THETA_DA then begin
        state_Rot := De_Accel_Rot;
      end;
    end;
    De_Accel_Rot: begin
      if abs(error_finalrot) < TOL_FINTHETA then begin
        state_Rot := Stop_Rot;
      end else if abs(error_finalrot) > THETA_NEWPOSE  then begin
        state_Rot := Rotation;
      end;
    end;
    Stop_Rot: begin
      if abs(error_finalrot) > THETA_NEWPOSE then begin
        state_Rot := Rotation;
      end;
    end;
  end;

  //Outputs
  case state_Rot of
    Rotation : begin
      W := rotateToFinal*VEL_ANG_NOM;
    end;
    De_Accel_Rot : begin
      W := rotateToFinal*VEL_ANG_NOM/3;
    end;
    Stop_Rot : begin
      W := 0;
    end;
  end;

  MotorVel(V,Vn,W,RC);

  // --------------------------------------------------
  // DEBUG
  // Robot linear and angular velocities
  SetRCValue(14,4,format('%.4g',[V]));
  SetRCValue(15,4,format('%.4g',[Vn]));
  SetRCValue(16,4,format('%.4g',[W]));
  SetRCValue(4,15,format('%.4g',[error_dist]));

end;