// Tarefa 4 do enunciado — GotoXY SEM máquina de estados.
// ATENÇÃO: esta rotina NÃO vem da solução do professor. É uma implementação
// de referência escrita para o StudyHub, para permitir avaliação automática.
// Passar neste avaliador não garante equivalência com o que o professor espera.
procedure gotoXYCont(xf, yf, tf: double; var RC: TRobotControls);
const
  K_LIN = 5;    // ganho proporcional linear  [1/s]
  K_ANG = 3;    // ganho proporcional angular [1/s]
var
  ang_target, error_dist, error_finalrot, vel, V, Vn, W: double;
begin
  //Calc errors
  ang_target     := ATan2(yf - yOdo, xf - xOdo);
  error_dist     := Sqrt(sqr(xf - xOdo) + sqr(yf - yOdo));
  error_finalrot := NormalizeAngle(tf - thOdo);

  //Lei proporcional linear com saturacao e zona morta
  vel := K_LIN * error_dist;
  if vel > VEL_LIN_NOM then vel := VEL_LIN_NOM;
  if error_dist < TOL_FINDIST then vel := 0;

  //Decomposicao no referencial do robo
  V  := vel * cos(ang_target - thOdo);
  Vn := vel * sin(ang_target - thOdo);

  //Lei proporcional angular com saturacao e zona morta
  W := K_ANG * error_finalrot;
  if W >  VEL_ANG_NOM then W :=  VEL_ANG_NOM;
  if W < -VEL_ANG_NOM then W := -VEL_ANG_NOM;
  if abs(error_finalrot) < TOL_FINTHETA then W := 0;

  MotorVel(V, Vn, W, RC);

  // --------------------------------------------------
  // DEBUG
  SetRCValue(14,4,format('%.4g',[V]));
  SetRCValue(15,4,format('%.4g',[Vn]));
  SetRCValue(16,4,format('%.4g',[W]));
  SetRCValue(4,15,format('%.4g',[error_dist]));
end;
