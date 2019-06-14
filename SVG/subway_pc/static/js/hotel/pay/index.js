define(function(require) {

    App.Models.pay = Backbone.Model.extend({});

    App.Collections.pay = Backbone.Collection.extend({
        model: App.Models.pay
    });

    App.Views.pay = Backbone.View.extend({
        el: '#payBox',
        template:_.template(require('../../templates/hotel/pay/index.html')),
        events:{
            'click .jsGoBack':hotel.goBack,
            'click #certificatesType':'certificatesType',
            'click *[data-md]':'addMonitor',
            'click #getCardInfo':'getCardInfo'
        },
        addMonitor:function(e){
            var tag = $(e.currentTarget),md = tag.data('md'), info = {page:'pay'};
            if(md){
                _.each(md,function(value, key){
                    info['data-md-'+key] = value;
                });       
                monitor.log(info,'click');
            }
            return;
        },
        initialize: function(opt) {
            $(this.el).off();
            var self = this;
            this.data = hotel.getInfo('toPay');
            if(!this.data){
                this.$el.html('').hide();
                window.history.back();
                return;
            }
            hotel.trigger('showLoading');
            this.render();
            /*disp统计*/
            monitor.log({page:'pay'},'disp');
            hotel.trigger('hideLoading');
        },
        render:function(){
            var self = this;
            this.$el.html(this.template({totalPrice:this.data.TotalPrice}));
            self.$el.siblings().hide();  
            this.$el.show();
            this.$el.find('.mainBox').addClass('animated fadeInRight');
            setTimeout(function(){
                self.$el.find('.mainBox').removeClass('animated fadeInRight');
            },1000);
            var ua = navigator.userAgent.toLowerCase();
            if (/aphone\s*browser/.test(ua)) {
                var boxHeight = store.get('docEle').height||this.$el.height();
                var mainBoxBtHeight = this.$el.find('.mainBoxBt').height()+1;
                var toTop = boxHeight - mainBoxBtHeight;
                this.$('.mainBoxBt').css({'top':toTop+'px'});
                this.$el.css({'height':boxHeight+'px'});
            }
        },
        certificatesType:function(e){
            $(e.currentTarget).find('input').blur();
            hotel.popWin('certificatesType');
        },
        getCardInfo:function(e) {
            var self = this;
            var cardInfo = $('#cardForm').serializeArray();
            var card = {
                data: {},
                rule: {},
                status: false
            };
            var IdText = ['身份证','护照','其他'];
            var IdType = ['IdentityCard','Passport','Other'];
            _.each(cardInfo, function (v, i) {
                var name = v.name.split('-');
                card.data[name[0]] = v.value;
                if(name[1]=='isCredentialsCode' && card.data['cardtype']){
                    var isCardType = IdText.indexOf(card.data['cardtype']);
                    isCardType !== -1 && (name[1] = 'is'+IdType[isCardType]);
                }
                card.rule[name[0]] = name[1] || '';
            });
            hotel.validator(card, function (data) {
                card.status = true;
            });
            if(card.status){
                var cardData = card.data;
                var CreditCard = {
                    Number:cardData.card,
                    CVV:cardData.safecode,
                    ExpirationYear: (new Date()).getFullYear().toString().substr(0,2)+''+cardData.validity.substr(2,2),//////////////////////////////////////////////////////////
                    ExpirationMonth:cardData.validity.substr(0,2),//////////////////////////////////////////////////////////
                    HolderName:cardData.cardholder,
                    IdType:IdType[IdText.indexOf(cardData.cardtype)] || '',
                    IdNo:cardData.credentialscode
                };
                this.data.CreditCard = JSON.stringify(CreditCard);
				/*添加loading*/
                hotel.trigger('showLoading');
                hotel.getData({data:this.data,url:'/elong/ordercreate',cb:function(data){//去提交订单
					/*移除loading*/
                	hotel.trigger('hideLoading');
                    hotel.addInfo({type:'toOrderStatus',data: _.extend(store.get('orderStatus'),{
                        totalPrice:self.data.TotalPrice,
                        data:data
                    })});
                    window.location.href = 'http://' + window.location.host + '/hotel/#orderStatus/';
                }});

            }

        }
    });

    return function(opt) {
        new App.Views.pay(opt);
    }
});