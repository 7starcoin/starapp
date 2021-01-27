import D2 from '../../../img/cards/D2.png';
import H2 from '../../../img/cards/H2.png';
import C2 from '../../../img/cards/C2.png';
import S2 from '../../../img/cards/S2.png';
import D3 from '../../../img/cards/D3.png';
import H3 from '../../../img/cards/H3.png';
import C3 from '../../../img/cards/C3.png';
import S3 from '../../../img/cards/S3.png';
import D4 from '../../../img/cards/D4.png';
import H4 from '../../../img/cards/H4.png';
import C4 from '../../../img/cards/C4.png';
import S4 from '../../../img/cards/S4.png';
import D5 from '../../../img/cards/D5.png';
import H5 from '../../../img/cards/H5.png';
import C5 from '../../../img/cards/C5.png';
import S5 from '../../../img/cards/S5.png';
import D6 from '../../../img/cards/D6.png';
import H6 from '../../../img/cards/H6.png';
import C6 from '../../../img/cards/C6.png';
import S6 from '../../../img/cards/S6.png';
import D7 from '../../../img/cards/D7.png';
import H7 from '../../../img/cards/H7.png';
import C7 from '../../../img/cards/C7.png';
import S7 from '../../../img/cards/S7.png';
import D8 from '../../../img/cards/D8.png';
import H8 from '../../../img/cards/H8.png';
import C8 from '../../../img/cards/C8.png';
import S8 from '../../../img/cards/S8.png';
import D9 from '../../../img/cards/D9.png';
import H9 from '../../../img/cards/H9.png';
import C9 from '../../../img/cards/C9.png';
import S9 from '../../../img/cards/S9.png';
import D10 from '../../../img/cards/D10.png';
import H10 from '../../../img/cards/H10.png';
import C10 from '../../../img/cards/C10.png';
import S10 from '../../../img/cards/S10.png';
import DJ from '../../../img/cards/DJ.png';
import HJ from '../../../img/cards/HJ.png';
import CJ from '../../../img/cards/CJ.png';
import SJ from '../../../img/cards/SJ.png';
import DQ from '../../../img/cards/DQ.png';
import HQ from '../../../img/cards/HQ.png';
import CQ from '../../../img/cards/CQ.png';
import SQ from '../../../img/cards/SQ.png';
import DK from '../../../img/cards/DK.png';
import HK from '../../../img/cards/HK.png';
import CK from '../../../img/cards/CK.png';
import SK from '../../../img/cards/SK.png';
import DA from '../../../img/cards/DA.png';
import HA from '../../../img/cards/HA.png';
import CA from '../../../img/cards/CA.png';
import SA from '../../../img/cards/SA.png';
import J from '../../../img/cards/J.png';
import X from '../../../img/cards/X.png';
import C from '../../../img/cards/C.png';
import H from '../../../img/cards/H.png';
import S from '../../../img/cards/S.png';
import D from '../../../img/cards/D.png';

const Icons = {D2: D2, H2: H2, C2: C2, S2: S2, D3: D3, H3: H3, C3: C3, S3: S3, D4: D4, H4: H4, C4: C4, S4: S4, D5: D5, H5: H5, C5: C5, S5: S5, D6: D6, H6: H6, C6: C6, S6: S6, D7: D7, H7: H7, C7: C7, S7: S7, D8: D8, H8: H8, C8: C8, S8: S8, D9: D9, H9: H9, C9: C9, S9: S9, D10: D10, H10: H10, C10: C10, S10: S10, DJ: DJ, HJ: HJ, CJ: CJ, SJ: SJ, DQ: DQ, HQ: HQ, CQ: CQ, SQ: SQ, DK: DK, HK: HK, CK: CK, SK: SK, DA: DA, HA: HA, CA: CA, SA: SA, J: J, X: X, C: C, H: H, S: S, D: D};

export default class CardsManager {

    static get(name) {
        return Icons[name];
    }

    static getAll(){
        return Icons;
    }

}